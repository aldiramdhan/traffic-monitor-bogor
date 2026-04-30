# Traffic Monitor Bogor

Sistem pemantauan lalu lintas real-time Kota Bogor berbasis CCTV dengan analisis AI.

## Arsitektur

```
traffic-monitor-bogor/
├── cctv-bogor-app/      # Frontend — Next.js 15 + TypeScript
├── cctv-bogor-api/      # Backend  — FastAPI + PostgreSQL + Redis
├── docs/
│   └── references/      # Referensi penelitian (.bib)
└── docker-compose.yml   # Menjalankan semua layanan sekaligus
```

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Leaflet, HLS.js |
| Backend | FastAPI, Python 3.13, SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI Vision | Google Vertex AI AutoML Vision |
| AI Text | Google Gemini 2.0 Flash |
| Container | Docker + Docker Compose |

## Alur Analisis

```
Klik "Analisis Cerdas"
  → FastAPI cek Redis cache
  → (cache miss) ambil frame CCTV via ffmpeg (async)
  → Vertex AI AutoML Vision hitung jumlah kendaraan
  → Algoritma threshold → label: Lancar / Sedang / Padat
  → Gemini terima label + data → hasilkan rekomendasi
  → Simpan ke Redis (TTL 30 menit) + PostgreSQL
  → Kirim rekomendasi ke frontend
```

## Menjalankan dengan Docker

```bash
# 1. Salin env file
cp cctv-bogor-api/.env.example cctv-bogor-api/.env
# Edit cctv-bogor-api/.env: isi GEMINI_API_KEY, biarkan VERTEX_AI_MOCK=true

# 2. Build & jalankan semua layanan
docker compose up --build

# Akses:
# Frontend : http://localhost:3000
# API Docs : http://localhost:8000/docs
```

## Menjalankan Secara Lokal (tanpa Docker)

### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL 16
- Redis 7
- ffmpeg (`brew install ffmpeg`)

### Backend

```bash
cd cctv-bogor-api

# Setup database
createdb traffic_monitor
psql traffic_monitor -c "CREATE USER traffic_user WITH PASSWORD 'traffic_dev_pass';"
psql traffic_monitor -c "GRANT ALL PRIVILEGES ON DATABASE traffic_monitor TO traffic_user;"

# Setup environment
cp .env.example .env
# Edit .env: isi GEMINI_API_KEY

# Install & jalankan
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Tabel dan data CCTV otomatis dibuat saat startup
```

### Frontend

```bash
cd cctv-bogor-app
cp .env.example .env.local
npm install
npm run dev
# Buka http://localhost:3000
```

## Threshold Algoritma Kepadatan

| Label | Kondisi | Default |
|-------|---------|---------|
| Lancar | kendaraan < threshold_low | < 10 |
| Sedang | threshold_low ≤ kendaraan ≤ threshold_high | 10–25 |
| Padat | kendaraan > threshold_high | > 25 |

Threshold dapat dikonfigurasi per-CCTV di tabel `cctv_points` (kolom `threshold_low` dan `threshold_high`).

## Vertex AI (Produksi)

```bash
# Di cctv-bogor-api/.env:
VERTEX_AI_MOCK=false
VERTEX_AI_PROJECT=your-gcp-project-id
VERTEX_AI_LOCATION=asia-southeast1
VERTEX_AI_ENDPOINT_ID=your-automl-endpoint-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/cctv` | Daftar semua titik CCTV |
| `GET` | `/api/cctv/{id}` | Detail satu CCTV |
| `POST` | `/api/analyze` | Jalankan analisis lalu lintas |
| `GET` | `/docs` | Swagger UI |

### Contoh Request Analisis

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cctvId": "btm-juanda",
    "locationName": "Simpang BTM Arah Juanda",
    "lat": -6.604264,
    "lon": 106.796570
  }'
```

---

Dibuat untuk Tugas Akhir — Muhamad Aldi Ramdani
