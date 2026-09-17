from __future__ import annotations

from contextlib import closing

from fastapi import FastAPI, HTTPException, Query

from src.config import database_path
from src.repository import get_inflection_point, list_inflection_points, summary
from src.storage import connect


app = FastAPI(
    title="Iron Ledger Analytics",
    version="0.1.0",
    description="Consulta de observacoes e pontos de inflexao derivados da Olist.",
)


@app.get("/health")
def health() -> dict[str, str]:
    with closing(connect(database_path())):
        return {"status": "ok"}


@app.get("/analytics/summary")
def analytics_summary() -> dict[str, object]:
    with closing(connect(database_path())) as connection:
        return summary(connection)


@app.get("/analytics/inflection-points")
def inflection_points(
    seller_id: str | None = None,
    metric: str | None = None,
    severity: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, object]:
    with closing(connect(database_path())) as connection:
        try:
            items = list_inflection_points(
                connection,
                seller_id=seller_id,
                metric=metric,
                severity=severity,
                limit=limit,
                offset=offset,
            )
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    return {"items": items, "count": len(items), "limit": limit, "offset": offset}


@app.get("/analytics/inflection-points/{point_id}")
def inflection_point(point_id: str) -> dict[str, object]:
    with closing(connect(database_path())) as connection:
        item = get_inflection_point(connection, point_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Ponto de inflexao nao encontrado")
    return item


def run() -> None:
    import uvicorn

    uvicorn.run("src.api.server:app", host="0.0.0.0", port=8000, reload=False)
