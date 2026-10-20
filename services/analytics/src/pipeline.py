from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from src.detectors.change_point_detector import detect_inflection_points
from src.ingestion.olist_loader import build_weekly_observations, load_olist
from src.reporting.quality_report import write_quality_report
from src.storage import connect


@dataclass(frozen=True)
class PipelineResult:
    source_rows: dict[str, int]
    observations: int
    inflection_points: int
    database_path: Path
    report_path: Path


def run_pipeline(
    data_dir: Path, database_path: Path, report_path: Path
) -> PipelineResult:
    connection = connect(database_path)
    try:
        source_rows = load_olist(connection, data_dir)
        observations = build_weekly_observations(connection)
        inflection_points = detect_inflection_points(connection)
        write_quality_report(connection, report_path)
        return PipelineResult(
            source_rows=source_rows,
            observations=observations,
            inflection_points=inflection_points,
            database_path=database_path,
            report_path=report_path,
        )
    finally:
        connection.close()
