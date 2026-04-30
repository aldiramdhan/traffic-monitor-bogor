from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str

    # CORS
    frontend_url: str = "http://localhost:3000"

    # PostgreSQL (asyncpg driver)
    db_url: str = "postgresql+asyncpg://traffic_user:traffic_dev_pass@localhost:5432/traffic_monitor"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 1800  # 30 minutes

    # Vertex AI AutoML Vision
    vertex_ai_mock: bool = True
    vertex_ai_project: str = ""
    vertex_ai_location: str = "asia-southeast1"
    vertex_ai_endpoint_id: str = ""
    google_application_credentials: str = ""

    # Global traffic threshold defaults (used in seed; overridden per-CCTV in DB)
    default_threshold_low: int = 10
    default_threshold_high: int = 25

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
