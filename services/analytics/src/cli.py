from __future__ import annotations

import argparse
import json
from pathlib import Path

from src.config import DEFAULT_DATA_DIR, DEFAULT_DATABASE_PATH, DEFAULT_REPORT_PATH
from src.ingestion.olist_downloader import DownloadError, download_olist
from src.pipeline import run_pipeline


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Pipeline analitico da Olist")
    commands = root.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run", help="Importa, agrega, detecta e gera o relatorio")
    run.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    run.add_argument("--database", type=Path, default=DEFAULT_DATABASE_PATH)
    run.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    download = commands.add_parser("download", help="Baixa os CSVs da Olist do Kaggle")
    download.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    download.add_argument(
        "--force", action="store_true", help="Baixa mesmo se os CSVs ja existirem"
    )
    return root


def main() -> None:
    arguments = parser().parse_args()
    if arguments.command == "download":
        try:
            files = download_olist(arguments.data_dir, force=arguments.force)
        except DownloadError as error:
            raise SystemExit(str(error)) from error
        status = "baixados" if files else "ja presentes"
        print(f"CSVs da Olist {status} em {arguments.data_dir}")
    elif arguments.command == "run":
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
