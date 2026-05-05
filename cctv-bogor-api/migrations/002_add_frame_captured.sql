-- Migration 002: add frame_captured column to analysis_history
-- Safe to run multiple times (idempotent via IF NOT EXISTS / DO NOTHING pattern)

ALTER TABLE analysis_history
    ADD COLUMN IF NOT EXISTS frame_captured BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN analysis_history.frame_captured IS
    'True = real CCTV frame was captured and sent to AutoML. False = mock/fallback data used.';
