-- migrations/init.sql
-- Idempotent: safe to run multiple times

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Table: cctv_points
-- ============================================================
CREATE TABLE IF NOT EXISTS cctv_points (
    id                  VARCHAR(64)         PRIMARY KEY,
    nama                VARCHAR(255)        NOT NULL,
    lat                 DOUBLE PRECISION    NOT NULL,
    lon                 DOUBLE PRECISION    NOT NULL,
    stream_url          TEXT                NOT NULL,
    status              VARCHAR(16)         NOT NULL DEFAULT 'online'
                            CHECK (status IN ('online', 'offline', 'maintenance')),
    description         TEXT,
    sequence_order      INTEGER             NOT NULL UNIQUE,
    threshold_low       INTEGER             NOT NULL DEFAULT 10,
    threshold_high      INTEGER             NOT NULL DEFAULT 25,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cctv_sequence ON cctv_points(sequence_order);
CREATE INDEX IF NOT EXISTS idx_cctv_status   ON cctv_points(status);

-- ============================================================
-- Table: analysis_history
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_history (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    cctv_id             VARCHAR(64)     REFERENCES cctv_points(id) ON DELETE SET NULL,
    next_cctv_id        VARCHAR(64)     REFERENCES cctv_points(id) ON DELETE SET NULL,

    -- AutoML Vision output (internal, never sent to frontend)
    vehicle_count       INTEGER         NOT NULL,
    next_vehicle_count  INTEGER,
    automl_raw          JSONB,

    -- Derived by threshold algorithm (Gemini input)
    density_label       VARCHAR(8)      NOT NULL
                            CHECK (density_label IN ('Lancar', 'Sedang', 'Padat')),
    next_density_label  VARCHAR(8)
                            CHECK (next_density_label IN ('Lancar', 'Sedang', 'Padat')),

    -- Gemini output (sent to frontend)
    recommendation      TEXT            NOT NULL,
    alternative_routes  JSONB           NOT NULL,
    traffic_label       VARCHAR(8)      NOT NULL
                            CHECK (traffic_label IN ('Lancar', 'Sedang', 'Padat')),
    peak_hours          VARCHAR(16),

    analyzed_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_cctv_id     ON analysis_history(cctv_id);
CREATE INDEX IF NOT EXISTS idx_history_analyzed_at ON analysis_history(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_label       ON analysis_history(density_label);
