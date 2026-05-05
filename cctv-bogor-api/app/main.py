from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, AsyncSessionLocal
from app.models.db_models import Base
from app.data.seed import seed_if_empty
from app.routers import cctv, analyze, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_if_empty(session)

    app.state.redis = aioredis.from_url(
        settings.redis_url, encoding="utf-8", decode_responses=True
    )

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────
    await app.state.redis.aclose()
    await engine.dispose()


app = FastAPI(
    title="CCTV Bogor API",
    description=(
        "Backend API for Traffic Monitor Bogor. "
        "Captures CCTV frames via ffmpeg, runs AutoML Vision vehicle detection, "
        "applies per-location threshold labeling, and generates Gemini-powered "
        "traffic recommendations."
    ),
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cctv.router,     prefix="/api")
app.include_router(analyze.router,  prefix="/api")
app.include_router(history.router,  prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "CCTV Bogor API",
        "version": "2.1.0",
        "endpoints": {
            "GET  /api/cctv":           "All CCTV locations",
            "GET  /api/cctv/{id}":      "Single CCTV location",
            "POST /api/analyze":        "Run traffic analysis pipeline",
            "GET  /api/history":        "Analysis history (newest first)",
            "GET  /health":             "Health check (DB + Redis)",
            "GET  /docs":               "Swagger UI",
        },
    }


@app.get("/health", tags=["Health"])
async def health(request: Request):
    """Ping PostgreSQL and Redis. Returns 200 if both are reachable."""
    checks: dict[str, str] = {}

    # PostgreSQL
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"

    # Redis
    try:
        await request.app.state.redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    status_code = 200 if all(v == "ok" for v in checks.values()) else 503
    return JSONResponse({"status": "ok" if status_code == 200 else "degraded", **checks}, status_code=status_code)
