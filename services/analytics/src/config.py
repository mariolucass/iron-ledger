from __future__ import annotations

import os
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = SERVICE_ROOT / "data" / "raw"
DEFAULT_DATABASE_PATH = SERVICE_ROOT / "data" / "processed" / "analytics.db"
DEFAULT_REPORT_PATH = SERVICE_ROOT / "reports" / "olist-data-quality.md"


def database_path() -> Path:
    return Path(os.getenv("ANALYTICS_DATABASE_PATH", DEFAULT_DATABASE_PATH))
