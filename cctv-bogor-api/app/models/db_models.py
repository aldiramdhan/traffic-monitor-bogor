from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Text, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import uuid


class CCTVPoint(Base):
    __tablename__ = "cctv_points"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    nama: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    stream_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="online")
    description: Mapped[str | None] = mapped_column(Text)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    threshold_low: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    threshold_high: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint("status IN ('online','offline','maintenance')", name="ck_cctv_status"),
    )


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cctv_id: Mapped[str | None] = mapped_column(String(64))
    next_cctv_id: Mapped[str | None] = mapped_column(String(64))

    # AutoML Vision output (internal)
    vehicle_count: Mapped[int] = mapped_column(Integer, nullable=False)
    next_vehicle_count: Mapped[int | None] = mapped_column(Integer)
    automl_raw: Mapped[dict | None] = mapped_column(JSONB)

    # Threshold algorithm output (Gemini input)
    density_label: Mapped[str] = mapped_column(String(8), nullable=False)
    next_density_label: Mapped[str | None] = mapped_column(String(8))

    # Gemini output (sent to frontend)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    alternative_routes: Mapped[dict] = mapped_column(JSONB, nullable=False)
    traffic_label: Mapped[str] = mapped_column(String(8), nullable=False)
    peak_hours: Mapped[str | None] = mapped_column(String(16))

    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
