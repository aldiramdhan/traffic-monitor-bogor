from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel
from dataclasses import dataclass

DensityLabel = Literal["Lancar", "Sedang", "Padat"]


# ── CCTV ─────────────────────────────────────────────────────────────────────

class CCTVLocation(BaseModel):
    id: str
    nama: str
    lat: float
    lon: float
    stream_url: str
    status: Literal["online", "offline", "maintenance"]
    description: Optional[str] = None
    sequence_order: int
    threshold_low: int = 10
    threshold_high: int = 25


# ── Analysis request ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    cctvId: str
    locationName: str
    lat: float
    lon: float


# ── AutoML internal result (never sent to frontend) ───────────────────────────

class AutoMLResult(BaseModel):
    vehicle_count: int
    frame_captured: bool          # False when using mock data
    raw_detections: list[dict]


# ── Gemini input dataclass (internal) ────────────────────────────────────────

@dataclass
class GeminiAnalysisInput:
    location_name: str
    lat: float
    lon: float
    density_label: str          # from threshold algorithm
    vehicle_count: int          # internal only

    next_location_name: str
    next_density_label: str

    current_time: str           # e.g. "Rabu, 08:30"


# ── Frontend response ─────────────────────────────────────────────────────────

class AlternativeRoute(BaseModel):
    route_name: str
    description: str
    maps_url: str
    estimated_time: str


class AnalyzeResponse(BaseModel):
    success: bool
    traffic_label: DensityLabel
    recommendation: str
    alternative_routes: list[AlternativeRoute]
    peak_hours: str
    cached: bool
    timestamp: str
    # vehicle_count, density_label, automl_raw → intentionally excluded


# ── History record (GET /api/history) ────────────────────────────────────────

class HistoryRecord(BaseModel):
    id: UUID
    cctv_id: Optional[str]
    vehicle_count: int
    next_vehicle_count: Optional[int]
    density_label: str
    next_density_label: Optional[str]
    traffic_label: str
    recommendation: str
    alternative_routes: list[dict]
    peak_hours: Optional[str]
    frame_captured: bool
    analyzed_at: datetime
