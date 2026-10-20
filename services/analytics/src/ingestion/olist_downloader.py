from __future__ import annotations

import base64
import json
import os
import shutil
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

from src.ingestion.olist_loader import SPECS, validate_dataset

DATASET_URL = (
    "https://www.kaggle.com/api/v1/datasets/download/olistbr/brazilian-ecommerce"
)
REQUIRED_FILES = tuple(spec.filename for spec in SPECS)


class DownloadError(RuntimeError):
    pass


def download_olist(data_dir: Path, *, force: bool = False) -> list[str]:
    """Baixa o dataset da Olist do Kaggle e extrai apenas os CSVs usados."""
    data_dir.mkdir(parents=True, exist_ok=True)
    if not force and all((data_dir / name).is_file() for name in REQUIRED_FILES):
        validate_dataset(data_dir)
        return []

    with tempfile.TemporaryDirectory(dir=data_dir.parent) as workdir:
        archive = Path(workdir) / "olist.zip"
        _fetch(archive)
        extracted = _extract(archive, data_dir)

    validate_dataset(data_dir)
    return extracted


def _fetch(target: Path) -> None:
    request = urllib.request.Request(DATASET_URL, headers=_auth_headers())
    try:
        with urllib.request.urlopen(request, timeout=60) as response, target.open(
            "wb"
        ) as output:
            shutil.copyfileobj(response, output)
    except urllib.error.HTTPError as error:
        hint = (
            " Configure KAGGLE_USERNAME/KAGGLE_KEY ou ~/.kaggle/kaggle.json."
            if error.code in (401, 403)
            else ""
        )
        raise DownloadError(
            f"Kaggle respondeu HTTP {error.code} ao baixar a Olist.{hint}"
        ) from error
    except urllib.error.URLError as error:
        raise DownloadError(f"Falha de rede ao baixar a Olist: {error.reason}") from error


def _extract(archive: Path, data_dir: Path) -> list[str]:
    try:
        with zipfile.ZipFile(archive) as bundle:
            members = {Path(name).name: name for name in bundle.namelist()}
            missing = [name for name in REQUIRED_FILES if name not in members]
            if missing:
                raise DownloadError(
                    f"Arquivo baixado nao contem: {', '.join(missing)}"
                )
            for name in REQUIRED_FILES:
                with bundle.open(members[name]) as source, (data_dir / name).open(
                    "wb"
                ) as output:
                    shutil.copyfileobj(source, output)
    except zipfile.BadZipFile as error:
        raise DownloadError("Resposta do Kaggle nao e um arquivo zip valido") from error
    return list(REQUIRED_FILES)


def _auth_headers() -> dict[str, str]:
    username = os.getenv("KAGGLE_USERNAME")
    key = os.getenv("KAGGLE_KEY")
    if not (username and key):
        config = Path(os.getenv("KAGGLE_CONFIG_DIR", Path.home() / ".kaggle"))
        credentials = config / "kaggle.json"
        if credentials.is_file():
            data = json.loads(credentials.read_text(encoding="utf-8"))
            username, key = data.get("username"), data.get("key")
    if not (username and key):
        return {}
    token = base64.b64encode(f"{username}:{key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}
