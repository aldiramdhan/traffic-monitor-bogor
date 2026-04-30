import asyncio
import base64
import random
from app.config import settings
from app.models.schemas import AutoMLResult


# ── Frame capture via ffmpeg ──────────────────────────────────────────────────

async def capture_frame(stream_url: str, timeout: float = 8.0) -> bytes | None:
    """
    Capture a single JPEG frame from an HLS stream using ffmpeg.
    Returns raw JPEG bytes or None if the stream is unreachable.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-y", "-loglevel", "error",
            "-t", "5",
            "-i", stream_url,
            "-frames:v", "1",
            "-f", "image2",
            "-vcodec", "mjpeg",
            "pipe:1",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return stdout if stdout else None
    except (asyncio.TimeoutError, Exception):
        return None


# ── Mock AutoML result (used when VERTEX_AI_MOCK=true) ───────────────────────

def _mock_result(location_name: str) -> AutoMLResult:
    count = random.randint(2, 40)
    car       = int(count * 0.55)
    motorcycle = int(count * 0.30)
    truck     = int(count * 0.10)
    bus       = count - car - motorcycle - truck
    return AutoMLResult(
        vehicle_count=count,
        raw_detections=[
            {"label": "car",        "count": car,        "confidence_avg": round(random.uniform(0.75, 0.95), 2)},
            {"label": "motorcycle", "count": motorcycle, "confidence_avg": round(random.uniform(0.70, 0.92), 2)},
            {"label": "truck",      "count": truck,      "confidence_avg": round(random.uniform(0.72, 0.90), 2)},
            {"label": "bus",        "count": bus,        "confidence_avg": round(random.uniform(0.68, 0.88), 2)},
        ],
    )


# ── Real Vertex AI predict (used when VERTEX_AI_MOCK=false) ──────────────────

def _parse_vertex_response(response, location_name: str) -> AutoMLResult:
    """Parse Vertex AI object detection response into AutoMLResult."""
    counts: dict[str, int] = {}
    for pred in response.predictions:
        for label, confidence in zip(pred.get("displayNames", []), pred.get("confidences", [])):
            if confidence >= 0.5:
                counts[label] = counts.get(label, 0) + 1

    vehicle_labels = {"car", "motorcycle", "truck", "bus", "vehicle"}
    total = sum(v for k, v in counts.items() if k.lower() in vehicle_labels) or sum(counts.values())

    raw = [{"label": k, "count": v} for k, v in counts.items()]
    return AutoMLResult(vehicle_count=total, raw_detections=raw)


async def predict_vehicles(frame_bytes: bytes | None, location_name: str) -> AutoMLResult:
    """
    Run vehicle detection on a frame.
    Falls back to mock if VERTEX_AI_MOCK=true or frame_bytes is None.
    """
    if settings.vertex_ai_mock or frame_bytes is None:
        return _mock_result(location_name)

    try:
        from google.cloud import aiplatform
        from google.cloud.aiplatform.gapic import PredictionServiceClient
        from google.protobuf import json_format
        from google.protobuf.struct_pb2 import Value

        b64 = base64.b64encode(frame_bytes).decode("utf-8")
        instance = json_format.ParseDict({"content": b64}, Value())
        params = json_format.ParseDict(
            {"confidenceThreshold": 0.5, "maxPredictions": 50}, Value()
        )
        endpoint = (
            f"projects/{settings.vertex_ai_project}"
            f"/locations/{settings.vertex_ai_location}"
            f"/endpoints/{settings.vertex_ai_endpoint_id}"
        )
        client_options = {"api_endpoint": f"{settings.vertex_ai_location}-aiplatform.googleapis.com"}
        client = PredictionServiceClient(client_options=client_options)

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.predict(endpoint=endpoint, instances=[instance], parameters=params),
        )
        return _parse_vertex_response(response, location_name)

    except Exception:
        return _mock_result(location_name)
