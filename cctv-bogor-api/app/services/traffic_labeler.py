from app.models.schemas import DensityLabel
from app.config import settings

# Global defaults — can be overridden per-CCTV via DB columns
DEFAULT_THRESHOLD_LOW  = settings.default_threshold_low
DEFAULT_THRESHOLD_HIGH = settings.default_threshold_high


def label_traffic_density(
    vehicle_count: int,
    threshold_low: int  = DEFAULT_THRESHOLD_LOW,
    threshold_high: int = DEFAULT_THRESHOLD_HIGH,
) -> DensityLabel:
    """
    Classify vehicle count into a traffic density label.

    Thresholds (per-CCTV from DB, defaults from config):
      vehicle_count < threshold_low               → Lancar
      threshold_low ≤ vehicle_count ≤ threshold_high → Sedang
      vehicle_count > threshold_high              → Padat

    Calibration guide:
      Narrow gang / inner road : low=5,  high=12
      Standard city road       : low=10, high=25  (default)
      Main arterial            : low=15, high=35
      Roundabout / intersection: low=8,  high=20
    """
    if vehicle_count < threshold_low:
        return "Lancar"
    elif vehicle_count <= threshold_high:
        return "Sedang"
    else:
        return "Padat"
