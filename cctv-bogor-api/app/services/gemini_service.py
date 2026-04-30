import json
from datetime import datetime
import httpx
from app.models.schemas import GeminiAnalysisInput, AnalyzeResponse, AlternativeRoute

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.0-flash:generateContent"
)


def _build_prompt(inp: GeminiAnalysisInput) -> str:
    return f"""Anda adalah AI analis lalu lintas profesional untuk Kota Bogor, Indonesia.

Hasil deteksi kendaraan real-time dari sistem Computer Vision:

LOKASI UTAMA: {inp.location_name} (koordinat: {inp.lat}, {inp.lon})
  • Status kepadatan: {inp.density_label}

LOKASI BERIKUTNYA: {inp.next_location_name}
  • Status kepadatan: {inp.next_density_label}

Waktu: {inp.current_time}

Berikan rekomendasi tindakan yang PRAKTIS dan SPESIFIK untuk Kota Bogor \
dalam format JSON berikut (HANYA JSON, tanpa teks tambahan):

{{
  "traffic_label": "{inp.density_label}",
  "recommendation": "Saran tindakan utama untuk pengguna jalan (max 60 kata, tanpa angka kendaraan)",
  "alternative_routes": [
    {{
      "route_name": "Nama jalan alternatif di Bogor",
      "description": "Keunggulan rute ini (max 30 kata)",
      "maps_url": "https://www.google.com/maps/dir/{inp.lat},{inp.lon}/[koordinat_tujuan]",
      "estimated_time": "estimasi waktu tempuh"
    }},
    {{
      "route_name": "Nama jalan alternatif kedua di Bogor",
      "description": "Keunggulan rute ini (max 30 kata)",
      "maps_url": "https://www.google.com/maps/dir/{inp.lat},{inp.lon}/[koordinat_tujuan]",
      "estimated_time": "estimasi waktu tempuh"
    }}
  ],
  "peak_hours": "HH:MM-HH:MM"
}}

Aturan:
- traffic_label HARUS sesuai dengan status kepadatan yang diberikan ({inp.density_label})
- Gunakan nama jalan Bogor yang nyata (Jl. Pajajaran, Jl. Juanda, Jl. Raya Ciawi, dll)
- Jangan sebutkan jumlah kendaraan dalam teks rekomendasi"""


async def analyze_traffic(inp: GeminiAnalysisInput, api_key: str) -> AnalyzeResponse:
    now = datetime.now().strftime("%A, %H:%M")
    inp.current_time = now

    payload = {
        "contents": [{"parts": [{"text": _build_prompt(inp)}]}],
        "generationConfig": {"temperature": 0.3, "topK": 1, "topP": 1, "maxOutputTokens": 600},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{GEMINI_API_URL}?key={api_key}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()

    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    cleaned = text.replace("```json", "").replace("```", "").strip()
    data = json.loads(cleaned)

    return AnalyzeResponse(
        success=True,
        traffic_label=data["traffic_label"],
        recommendation=data["recommendation"],
        alternative_routes=[AlternativeRoute(**r) for r in data["alternative_routes"]],
        peak_hours=data.get("peak_hours", ""),
        cached=False,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
