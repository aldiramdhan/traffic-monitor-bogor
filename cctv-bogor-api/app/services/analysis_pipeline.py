import asyncio

import redis.asyncio as aioredis
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.db_models import CCTVPoint, AnalysisHistory
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, GeminiAnalysisInput
from app.services import cache_service, vertex_service
from app.services.gemini_service import analyze_traffic
from app.services.traffic_labeler import label_traffic_density


async def _get_next_cctv(db: AsyncSession, current_order: int) -> CCTVPoint | None:
    total: int = await db.scalar(select(func.count()).select_from(CCTVPoint))
    next_order = (current_order % total) + 1
    return await db.scalar(select(CCTVPoint).where(CCTVPoint.sequence_order == next_order))


async def _save_history(
    db: AsyncSession,
    current: CCTVPoint,
    next_cctv: CCTVPoint | None,
    vehicle_count: int,
    next_vehicle_count: int | None,
    automl_raw: list[dict],
    density_label: str,
    next_density_label: str | None,
    frame_captured: bool,
    response: AnalyzeResponse,
) -> None:
    try:
        record = AnalysisHistory(
            cctv_id=current.id,
            next_cctv_id=next_cctv.id if next_cctv else None,
            vehicle_count=vehicle_count,
            next_vehicle_count=next_vehicle_count,
            automl_raw={"current": automl_raw, "next": []},
            density_label=density_label,
            next_density_label=next_density_label,
            recommendation=response.recommendation,
            alternative_routes=[r.model_dump() for r in response.alternative_routes],
            traffic_label=response.traffic_label,
            peak_hours=response.peak_hours,
            frame_captured=frame_captured,
        )
        db.add(record)
        await db.commit()
    except Exception:
        await db.rollback()


async def run_analysis(
    req: AnalyzeRequest,
    db: AsyncSession,
    redis: aioredis.Redis,
) -> AnalyzeResponse:
    # ── 1. Cache check ─────────────────────────────────────────────────────
    cached = await cache_service.get_cached(redis, req.cctvId)
    if cached:
        cached["cached"] = True
        return AnalyzeResponse(**cached)

    # ── 2. Load current CCTV from DB ───────────────────────────────────────
    current: CCTVPoint | None = await db.get(CCTVPoint, req.cctvId)
    if current is None:
        raise ValueError(f"CCTV '{req.cctvId}' not found in database")

    # ── 3. Load next CCTV in sequence ──────────────────────────────────────
    next_cctv = await _get_next_cctv(db, current.sequence_order)

    # ── 4. Capture frames concurrently ─────────────────────────────────────
    current_frame, next_frame = await asyncio.gather(
        vertex_service.capture_frame(current.stream_url),
        vertex_service.capture_frame(next_cctv.stream_url) if next_cctv else asyncio.sleep(0, result=None),
    )

    # ── 5. Run AutoML Vision concurrently ──────────────────────────────────
    current_automl, next_automl = await asyncio.gather(
        vertex_service.predict_vehicles(current_frame, current.nama),
        vertex_service.predict_vehicles(next_frame, next_cctv.nama) if next_cctv
        else asyncio.sleep(0, result=vertex_service._mock_result(req.locationName)),
    )

    # ── 6. Threshold algorithm → density labels ────────────────────────────
    density_label = label_traffic_density(
        current_automl.vehicle_count, current.threshold_low, current.threshold_high
    )
    next_density_label = (
        label_traffic_density(
            next_automl.vehicle_count,
            next_cctv.threshold_low if next_cctv else current.threshold_low,
            next_cctv.threshold_high if next_cctv else current.threshold_high,
        )
        if next_automl else None
    )

    # ── 7. Gemini analysis ─────────────────────────────────────────────────
    gemini_input = GeminiAnalysisInput(
        location_name=current.nama,
        lat=current.lat,
        lon=current.lon,
        density_label=density_label,
        vehicle_count=current_automl.vehicle_count,
        next_location_name=next_cctv.nama if next_cctv else req.locationName,
        next_density_label=next_density_label or density_label,
        current_time="",  # filled inside gemini_service
    )
    response = await analyze_traffic(gemini_input, settings.gemini_api_key)

    # ── 8. Persist history (fire-and-forget) ───────────────────────────────
    asyncio.create_task(_save_history(
        db, current, next_cctv,
        current_automl.vehicle_count,
        next_automl.vehicle_count if next_automl else None,
        current_automl.raw_detections,
        density_label, next_density_label,
        current_automl.frame_captured,
        response,
    ))

    # ── 9. Cache result ────────────────────────────────────────────────────
    await cache_service.set_cached(redis, req.cctvId, response.model_dump())

    return response
