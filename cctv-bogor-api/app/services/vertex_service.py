"""
vertex_service.py — Frame capture + AutoML Vision vehicle detection.

HOW TO SWAP IN YOUR REAL MODEL (after training is done):
  1. Deploy your AutoML Vision model on Vertex AI → copy the endpoint ID
  2. In .env set:
       VERTEX_AI_MOCK=false
       VERTEX_AI_PROJECT=your-gcp-project-id
       VERTEX_AI_LOCATION=asia-southeast1
       VERTEX_AI_ENDPOINT_ID=your-automl-endpoint-id
       GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  3. Restart the API — that's it. No code change needed.
"""
import asyncio
import base64
import io
import logging
import random

from app.config import settings
from app.models.schemas import AutoMLResult

logger = logging.getLogger(__name__)

# Pillow is optional but strongly recommended for preprocessing
try:
    from PIL import Image
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False
    logger.warning("Pillow not installed — frame preprocessing disabled. Run: pip install Pillow")

# Target resolution sent to AutoML Vision.
# 640×480 balances detection accuracy vs inference speed for road scenes.
_TARGET_WIDTH  = 640
_TARGET_HEIGHT = 480

# Vehicle class names that AutoML / your custom model is expected to output.
# Add or rename labels here if your training dataset uses different names.
_VEHICLE_LABELS = {"car", "motorcycle", "truck", "bus", "vehicle", "motorbike", "van", "minibus"}


# ─────────────────────────────────────────────────────────────────────────────
# Frame capture
# ─────────────────────────────────────────────────────────────────────────────

async def _run_ffmpeg(stream_url: str, seek_seconds: int, per_attempt_timeout: float) -> bytes | None:
    """One ffmpeg attempt at a given seek offset. Returns JPEG bytes or None."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-y", "-loglevel", "error",
            "-ss", str(seek_seconds),
            "-t", "6",
            "-i", stream_url,
            "-frames:v", "1",
            "-f", "image2",
            "-vcodec", "mjpeg",
            "pipe:1",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=per_attempt_timeout)
        return stdout if stdout else None
    except (asyncio.TimeoutError, OSError):
        return None


async def capture_frame(stream_url: str, timeout: float = 12.0) -> bytes | None:
    """
    Capture one JPEG frame from an HLS stream.

    Tries three seek offsets (2s, 6s, 10s) and returns the first non-empty frame.
    Returns None if all attempts fail — the pipeline will fall back to mock data.
    Per-attempt timeout = total_timeout / 3.
    """
    per_attempt = timeout / 3
    for seek in (2, 6, 10):
        frame = await _run_ffmpeg(stream_url, seek, per_attempt)
        if frame:
            return frame
    logger.warning("capture_frame: all attempts failed for %s", stream_url)
    return None


def preprocess_frame(jpeg_bytes: bytes) -> bytes:
    """
    Resize a JPEG frame to _TARGET_WIDTH × _TARGET_HEIGHT and re-encode at quality=85.

    Consistent input dimensions make AutoML Vision inference faster and more
    accurate — raw CCTV frames are often 1280×720 or larger with variable aspect ratios.
    Falls back to original bytes if Pillow is not installed.
    """
    if not _PIL_AVAILABLE or not jpeg_bytes:
        return jpeg_bytes
    try:
        img = Image.open(io.BytesIO(jpeg_bytes)).convert("RGB")
        img = img.resize((_TARGET_WIDTH, _TARGET_HEIGHT), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
    except Exception as exc:
        logger.warning("preprocess_frame failed: %s", exc)
        return jpeg_bytes


# ─────────────────────────────────────────────────────────────────────────────
# Mock result  (VERTEX_AI_MOCK=true or frame capture failed)
# ─────────────────────────────────────────────────────────────────────────────

def _mock_result(location_name: str) -> AutoMLResult:
    count      = random.randint(2, 40)
    car        = int(count * 0.55)
    motorcycle = int(count * 0.30)
    truck      = int(count * 0.10)
    bus        = count - car - motorcycle - truck
    return AutoMLResult(
        vehicle_count=count,
        frame_captured=False,
        raw_detections=[
            {"label": "car",        "count": car,        "confidence_avg": round(random.uniform(0.75, 0.95), 2)},
            {"label": "motorcycle", "count": motorcycle, "confidence_avg": round(random.uniform(0.70, 0.92), 2)},
            {"label": "truck",      "count": truck,      "confidence_avg": round(random.uniform(0.72, 0.90), 2)},
            {"label": "bus",        "count": bus,        "confidence_avg": round(random.uniform(0.68, 0.88), 2)},
        ],
    )


# ─────────────────────────────────────────────────────────────────────────────
# Real Vertex AI AutoML Vision prediction
# ─────────────────────────────────────────────────────────────────────────────

def _parse_vertex_response(predictions, location_name: str) -> AutoMLResult:
    """
    Parse Vertex AI AutoML Vision object-detection response.

    AutoML returns ONE prediction dict per image with three parallel arrays:
      displayNames[i]  — detected class name
      confidences[i]   — confidence score (0–1)
      bboxes[i]        — [xMin, xMax, yMin, yMax] normalised

    We aggregate by label (only classes in _VEHICLE_LABELS, threshold ≥ 0.5).
    """
    from google.protobuf import json_format

    counts: dict[str, list[float]] = {}

    for proto_pred in predictions:
        pred: dict = json_format.MessageToDict(proto_pred)
        names: list[str]  = pred.get("displayNames", [])
        confs: list[float] = pred.get("confidences",  [])

        for label, conf in zip(names, confs):
            if conf < 0.5:
                continue
            key = label.lower()
            counts.setdefault(key, []).append(conf)

    # Prefer known vehicle labels; fall back to all detections if model uses custom names
    vehicle_counts = {k: v for k, v in counts.items() if k in _VEHICLE_LABELS} or counts
    total = sum(len(v) for v in vehicle_counts.values())

    raw_detections = [
        {
            "label": label,
            "count": len(confs),
            "confidence_avg": round(sum(confs) / len(confs), 3),
        }
        for label, confs in vehicle_counts.items()
    ]

    return AutoMLResult(
        vehicle_count=total,
        frame_captured=True,
        raw_detections=raw_detections,
    )


async def _call_vertex_ai(frame_bytes: bytes, location_name: str) -> AutoMLResult:
    """
    Send a preprocessed JPEG frame to the deployed Vertex AI endpoint.

    ── SWAP POINT ──────────────────────────────────────────────────────────────
    Set VERTEX_AI_ENDPOINT_ID in .env to point to your trained AutoML model.
    This function requires no code changes — only env vars.
    ────────────────────────────────────────────────────────────────────────────
    """
    from google.cloud.aiplatform.gapic import PredictionServiceClient
    from google.protobuf import json_format
    from google.protobuf.struct_pb2 import Value

    b64_content = base64.b64encode(frame_bytes).decode("utf-8")
    instance    = json_format.ParseDict({"content": b64_content}, Value())
    parameters  = json_format.ParseDict(
        {"confidenceThreshold": 0.5, "maxPredictions": 100}, Value()
    )
    endpoint_path = (
        f"projects/{settings.vertex_ai_project}"
        f"/locations/{settings.vertex_ai_location}"
        f"/endpoints/{settings.vertex_ai_endpoint_id}"
    )
    client = PredictionServiceClient(
        client_options={"api_endpoint": f"{settings.vertex_ai_location}-aiplatform.googleapis.com"}
    )

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.predict(
            endpoint=endpoint_path,
            instances=[instance],
            parameters=parameters,
        ),
    )
    return _parse_vertex_response(response.predictions, location_name)


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

async def predict_vehicles(frame_bytes: bytes | None, location_name: str) -> AutoMLResult:
    """
    Run vehicle detection on a captured frame.

    Decision tree:
      frame_bytes is None  → mock  (stream unreachable)
      VERTEX_AI_MOCK=true  → mock  (local dev / no credentials)
      VERTEX_AI_MOCK=false → real Vertex AI call → on failure, mock fallback
    """
    if settings.vertex_ai_mock or frame_bytes is None:
        return _mock_result(location_name)

    try:
        processed = preprocess_frame(frame_bytes)
        return await _call_vertex_ai(processed, location_name)
    except Exception as exc:
        logger.error("Vertex AI prediction failed for '%s': %s", location_name, exc)
        return _mock_result(location_name)
