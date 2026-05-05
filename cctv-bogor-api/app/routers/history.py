from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import AnalysisHistory
from app.models.schemas import HistoryRecord

router = APIRouter(prefix="/history", tags=["History"])


def _to_schema(row: AnalysisHistory) -> HistoryRecord:
    return HistoryRecord(
        id=row.id,
        cctv_id=row.cctv_id,
        vehicle_count=row.vehicle_count,
        next_vehicle_count=row.next_vehicle_count,
        density_label=row.density_label,
        next_density_label=row.next_density_label,
        traffic_label=row.traffic_label,
        recommendation=row.recommendation,
        alternative_routes=row.alternative_routes if isinstance(row.alternative_routes, list) else [],
        peak_hours=row.peak_hours,
        frame_captured=row.frame_captured,
        analyzed_at=row.analyzed_at,
    )


@router.get("/", response_model=list[HistoryRecord])
async def get_history(
    cctv_id: str | None = Query(default=None, description="Filter by CCTV ID"),
    limit: int          = Query(default=20, ge=1, le=100),
    offset: int         = Query(default=0,  ge=0),
    db: AsyncSession    = Depends(get_db),
):
    """
    Return analysis history, newest first.
    Optionally filter by cctv_id. Max 100 records per page.
    """
    stmt = select(AnalysisHistory).order_by(desc(AnalysisHistory.analyzed_at))
    if cctv_id:
        stmt = stmt.where(AnalysisHistory.cctv_id == cctv_id)
    stmt = stmt.offset(offset).limit(limit)

    rows = await db.scalars(stmt)
    return [_to_schema(r) for r in rows]
