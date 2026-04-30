from contextlib import asynccontextmanager
import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, AsyncSessionLocal
from app.models.db_models import Base
from app.data.seed import seed_if_empty
from app.routers import cctv, analyze


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    # Create tables (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed CCTV data if DB is empty
    async with AsyncSessionLocal() as session:
        await seed_if_empty(session)

    # Connect Redis
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
        "Runs AutoML Vision frame analysis, applies threshold labeling, "
        "and generates Gemini-powered traffic recommendations."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cctv.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "CCTV Bogor API",
        "version": "2.0.0",
        "endpoints": {
            "GET  /api/cctv":        "All CCTV locations (from PostgreSQL)",
            "GET  /api/cctv/{id}":   "Single CCTV location",
            "POST /api/analyze":     "Run traffic analysis pipeline",
            "GET  /docs":            "Swagger UI",
            "GET  /redoc":           "ReDoc UI",
        },
    }
