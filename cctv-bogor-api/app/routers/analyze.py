from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.analysis_pipeline import run_analysis

router = APIRouter(prefix="/analyze", tags=["Analysis"])


def _get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis


@router.post("/", response_model=AnalyzeResponse)
async def analyze(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(_get_redis),
):
    try:
        return await run_analysis(body, db, redis)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/")
async def analyze_info():
    return {
        "endpoint": "POST /api/analyze",
        "body": {"cctvId": "str", "locationName": "str", "lat": "float", "lon": "float"},
        "response": "traffic_label, recommendation, alternative_routes, peak_hours, cached, timestamp",
    }
