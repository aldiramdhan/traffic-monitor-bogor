from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import CCTVPoint
from app.models.schemas import CCTVLocation

router = APIRouter(prefix="/cctv", tags=["CCTV"])


def _to_schema(row: CCTVPoint) -> CCTVLocation:
    return CCTVLocation(
        id=row.id, nama=row.nama, lat=row.lat, lon=row.lon,
        stream_url=row.stream_url, status=row.status,
        description=row.description, sequence_order=row.sequence_order,
        threshold_low=row.threshold_low, threshold_high=row.threshold_high,
    )


@router.get("/", response_model=list[CCTVLocation])
async def get_all_locations(db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(CCTVPoint).order_by(CCTVPoint.sequence_order))
    return [_to_schema(r) for r in rows]


@router.get("/{cctv_id}", response_model=CCTVLocation)
async def get_location(cctv_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(CCTVPoint, cctv_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"CCTV '{cctv_id}' tidak ditemukan")
    return _to_schema(row)
