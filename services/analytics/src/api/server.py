from __future__ import annotations

from contextlib import closing

from fastapi import FastAPI, HTTPException, Query

from src.config import database_path
from src.metrics import CLASSIFICATIONS, SEVERITIES, metric_catalog
from src.repository import (
    count_inflection_points,
    get_inflection_point,
    list_inflection_points,
    summary,
)
from src.storage import connect

app = FastAPI(
    title="Iron Ledger Analytics",
    version="0.2.0",
    description=(
        "Detecta mudancas persistentes no comportamento de vendedores e categorias "
        "(vendas, cancelamento, atraso, avaliacao) a partir de observacoes semanais. "
        "Hoje a fonte e o dataset publico da Olist; o mesmo modelo recebera os dados "
        "operacionais do Iron Ledger."
    ),
)


@app.get("/health")
def health() -> dict[str, str]:
    with closing(connect(database_path())):
        return {"status": "ok"}


@app.get("/analytics/summary")
def analytics_summary() -> dict[str, object]:
    with closing(connect(database_path())) as connection:
        return summary(connection)


@app.get("/analytics/metrics")
def analytics_metrics() -> dict[str, object]:
    """Catalogo das metricas monitoradas e dos rotulos de severidade e classificacao."""
    return {
        "metrics": metric_catalog(),
        "severities": SEVERITIES,
        "classifications": CLASSIFICATIONS,
    }


@app.get("/analytics/inflection-points")
def inflection_points(
    seller_id: str | None = None,
    metric: str | None = None,
    severity: str | None = None,
    classification: str | None = None,
    impact: str | None = Query(default=None, description="POSITIVE ou NEGATIVE"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, object]:
    filters = {
        "seller_id": seller_id,
        "metric": metric,
        "severity": severity,
        "classification": classification,
        "impact_filter": impact,
    }
    with closing(connect(database_path())) as connection:
        try:
            items = list_inflection_points(
                connection, **filters, limit=limit, offset=offset
            )
            total = count_inflection_points(connection, **filters)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    return {
        "items": items,
        "count": len(items),
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/analytics/inflection-points/{point_id}")
def inflection_point(point_id: str) -> dict[str, object]:
    with closing(connect(database_path())) as connection:
        item = get_inflection_point(connection, point_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Ponto de inflexao nao encontrado")
    return item


def run() -> None:
    import os

    import uvicorn

    uvicorn.run(
        "src.api.server:app",
        host="0.0.0.0",
        port=int(os.getenv("ANALYTICS_PORT", "8000")),
        reload=False,
    )
