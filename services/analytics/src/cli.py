from __future__ import annotations

import argparse
import json
from pathlib import Path

from src.config import DEFAULT_DATA_DIR, DEFAULT_DATABASE_PATH, DEFAULT_REPORT_PATH
from src.pipeline import run_pipeline


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Pipeline analitico da Olist")
    commands = root.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run", help="Importa, agrega, detecta e gera o relatorio")
    run.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    run.add_argument("--database", type=Path, default=DEFAULT_DATABASE_PATH)
    run.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    return root


def main() -> None:
    arguments = parser().parse_args()
    if arguments.command == "run":
        result = run_pipeline(arguments.data_dir, arguments.database, arguments.report)
        print(
            json.dumps(
                {
                    "sourceRows": result.source_rows,
                    "observations": result.observations,
                    "inflectionPoints": result.inflection_points,
                    "database": str(result.database_path),
                    "report": str(result.report_path),
                },
                ensure_ascii=False,
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
