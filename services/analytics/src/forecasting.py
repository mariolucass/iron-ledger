from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean, median, pstdev

MODEL_NAME = "Média móvel de 4 semanas"
MODEL_DESCRIPTION = (
    "Previsão da demanda semanal de cada produto como a média das 4 semanas "
    "anteriores, reavaliada semana a semana (backtest de origem móvel): cada "
    "semana é prevista só com o que se sabia antes dela e depois comparada à "
    "venda real."
)

WINDOW = 4
EVALUATION_WEEKS = 12
MIN_WEEKS = EVALUATION_WEEKS + WINDOW + 4
MIN_ERRORS_FOR_INTERVAL = 4
INTERVAL_Z = 1.96
EXCLUDED_STATUSES = ("canceled", "unavailable")
# Semana final com menos que esta fração da mediana recente é cauda truncada do dataset.
INCOMPLETE_WEEK_RATIO = 0.75

# Faixas de acurácia (1 - WAPE) usadas para rotular o produto.
GOOD_ACCURACY = 0.8
FAIR_ACCURACY = 0.6


@dataclass(frozen=True)
class WeekResult:
    period_start: date
    actual: int
    predicted: float
    lower: float | None
    upper: float | None


@dataclass(frozen=True)
class Backtest:
    weeks: list[WeekResult]
    next_period_start: date
    next_predicted: float

    @property
    def evaluated_units(self) -> int:
        return sum(week.actual for week in self.weeks)

    @property
    def absolute_error(self) -> float:
        return sum(abs(week.actual - week.predicted) for week in self.weeks)

    @property
    def signed_error(self) -> float:
        return sum(week.predicted - week.actual for week in self.weeks)

    @property
    def wape(self) -> float | None:
        total = self.evaluated_units
        return self.absolute_error / total if total else None

    @property
    def accuracy(self) -> float | None:
        wape = self.wape
        return None if wape is None else max(0.0, 1.0 - wape)

    @property
    def bias(self) -> float | None:
        total = self.evaluated_units
        return self.signed_error / total if total else None

    @property
    def coverage(self) -> float | None:
        banded = [week for week in self.weeks if week.lower is not None]
        if not banded:
            return None
        hits = sum(1 for week in banded if week.lower <= week.actual <= week.upper)
        return hits / len(banded)


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def backtest(series: list[int], first_week: date) -> Backtest | None:
    """Reavalia semana a semana a previsão por média móvel.

    `series` traz a demanda semanal contínua (semanas sem venda valem 0) a partir de
    `first_week`. Devolve None quando o histórico é curto demais para um backtest.
    """
    if len(series) < MIN_WEEKS:
        return None

    errors: list[float] = []
    results: list[WeekResult] = []
    evaluation_start = len(series) - EVALUATION_WEEKS
    for index in range(WINDOW, len(series)):
        predicted = mean(series[index - WINDOW : index])
        lower = upper = None
        if len(errors) >= MIN_ERRORS_FOR_INTERVAL:
            spread = INTERVAL_Z * pstdev(errors)
            lower, upper = max(0.0, predicted - spread), predicted + spread
        if index >= evaluation_start:
            results.append(
                WeekResult(
                    first_week + timedelta(weeks=index),
                    series[index],
                    predicted,
                    lower,
                    upper,
                )
            )
        errors.append(series[index] - predicted)

    return Backtest(
        weeks=results,
        next_period_start=first_week + timedelta(weeks=len(series)),
        next_predicted=mean(series[-WINDOW:]),
    )


def accuracy_status(accuracy: float | None) -> str:
    if accuracy is None:
        return "UNKNOWN"
    if accuracy >= GOOD_ACCURACY:
        return "GOOD"
    return "FAIR" if accuracy >= FAIR_ACCURACY else "POOR"


def _round(value: float | None, digits: int = 4) -> float | None:
    return None if value is None else round(value, digits)


def _last_complete_week(connection: sqlite3.Connection) -> date | None:
    """Última semana com volume normal: o fim do dataset costuma vir truncado."""
    rows = connection.execute(
        """
        SELECT substr(o.order_purchase_timestamp, 1, 10) AS day, COUNT(*) AS units
        FROM stg_order_items i
        JOIN stg_orders o ON o.order_id = i.order_id
        WHERE o.order_purchase_timestamp IS NOT NULL
          AND lower(o.order_status) NOT IN (?, ?)
        GROUP BY day
        """,
        EXCLUDED_STATUSES,
    ).fetchall()
    totals: dict[date, int] = {}
    for row in rows:
        week = _week_start(date.fromisoformat(row["day"]))
        totals[week] = totals.get(week, 0) + row["units"]
    if not totals:
        return None
    ordered = sorted(totals)
    while len(ordered) > WINDOW:
        last = ordered[-1]
        recent = [totals[week] for week in ordered[-13:-1]]
        if totals[last] >= INCOMPLETE_WEEK_RATIO * median(recent):
            return last
        ordered.pop()
    return ordered[-1]


def _weekly_demand(
    connection: sqlite3.Connection, product_ids: list[str], end_week: date
) -> dict[str, tuple[date, list[int]]]:
    """Demanda semanal contínua de cada produto, da primeira venda até `end_week`."""
    if not product_ids:
        return {}
    placeholders = ", ".join("?" for _ in product_ids)
    rows = connection.execute(
        f"""
        SELECT i.product_id,
               substr(o.order_purchase_timestamp, 1, 10) AS day,
               COUNT(*) AS units
        FROM stg_order_items i
        JOIN stg_orders o ON o.order_id = i.order_id
        WHERE i.product_id IN ({placeholders})
          AND o.order_purchase_timestamp IS NOT NULL
          AND lower(o.order_status) NOT IN (?, ?)
        GROUP BY i.product_id, day
        """,
        (*product_ids, *EXCLUDED_STATUSES),
    ).fetchall()

    weekly: dict[str, dict[date, int]] = {}
    for row in rows:
        week = _week_start(date.fromisoformat(row["day"]))
        if week > end_week:
            continue
        bucket = weekly.setdefault(row["product_id"], {})
        bucket[week] = bucket.get(week, 0) + row["units"]

    demand: dict[str, tuple[date, list[int]]] = {}
    for product_id, bucket in weekly.items():
        first = min(bucket)
        weeks = (end_week - first).days // 7 + 1
        demand[product_id] = (
            first,
            [bucket.get(first + timedelta(weeks=n), 0) for n in range(weeks)],
        )
    return demand


def _candidate_products(
    connection: sqlite3.Connection,
    *,
    window_start: date,
    end_week: date,
    category: str | None,
    search: str | None,
    limit: int,
) -> list[sqlite3.Row]:
    """Produtos com mais venda na janela avaliada (os que ainda estão vivos)."""
    clauses = [
        "lower(o.order_status) NOT IN (?, ?)",
        "substr(o.order_purchase_timestamp, 1, 10) >= ?",
        "substr(o.order_purchase_timestamp, 1, 10) < ?",
        "i.product_id IS NOT NULL",
    ]
    parameters: list[object] = [
        *EXCLUDED_STATUSES,
        window_start.isoformat(),
        (end_week + timedelta(weeks=1)).isoformat(),
    ]
    if category:
        clauses.append("COALESCE(NULLIF(p.product_category_name, ''), 'unknown') = ?")
        parameters.append(category)
    if search:
        clauses.append(
            "(i.product_id LIKE ? OR COALESCE(p.product_category_name, '') LIKE ?)"
        )
        term = f"%{search.strip()}%"
        parameters.extend([term, term])
    parameters.append(limit)
    return connection.execute(
        f"""
        SELECT i.product_id,
               COALESCE(NULLIF(MAX(p.product_category_name), ''), 'unknown') AS category,
               COUNT(*) AS recent_units
        FROM stg_order_items i
        JOIN stg_orders o ON o.order_id = i.order_id
        LEFT JOIN stg_products p ON p.product_id = i.product_id
        WHERE {" AND ".join(clauses)}
        GROUP BY i.product_id
        ORDER BY recent_units DESC, i.product_id
        LIMIT ?
        """,
        parameters,
    ).fetchall()


def _item(product_id: str, category: str, series: list[int], result: Backtest) -> dict:
    return {
        "product_id": product_id,
        "category": category,
        "units_total": sum(series),
        "evaluated_weeks": len(result.weeks),
        "evaluated_units": result.evaluated_units,
        "accuracy": _round(result.accuracy),
        "wape": _round(result.wape),
        "bias": _round(result.bias),
        "interval_coverage": _round(result.coverage),
        "status": accuracy_status(result.accuracy),
        "next_period_start": result.next_period_start.isoformat(),
        "next_predicted": _round(result.next_predicted, 2),
    }


def forecast_accuracy(
    connection: sqlite3.Connection,
    *,
    category: str | None = None,
    search: str | None = None,
    limit: int = 20,
) -> dict[str, object]:
    end_week = _last_complete_week(connection)
    items: list[dict] = []
    skipped = 0
    absolute_error = signed_error = evaluated_units = 0.0
    if end_week is not None:
        window_start = end_week - timedelta(weeks=EVALUATION_WEEKS - 1)
        candidates = _candidate_products(
            connection,
            window_start=window_start,
            end_week=end_week,
            category=category,
            search=search,
            limit=limit,
        )
        demand = _weekly_demand(
            connection, [row["product_id"] for row in candidates], end_week
        )
        for row in candidates:
            first_week, series = demand.get(row["product_id"], (None, []))
            result = backtest(series, first_week) if first_week else None
            if result is None:
                skipped += 1
                continue
            items.append(_item(row["product_id"], row["category"], series, result))
            absolute_error += result.absolute_error
            signed_error += result.signed_error
            evaluated_units += result.evaluated_units

    # Ordem do pior para o melhor: o que precisa de atenção aparece primeiro.
    items.sort(key=lambda item: (item["accuracy"] is None, item["accuracy"] or 0.0))
    overall_wape = absolute_error / evaluated_units if evaluated_units else None
    overall_accuracy = None if overall_wape is None else max(0.0, 1.0 - overall_wape)
    return {
        "items": items,
        "summary": {
            "products": len(items),
            "skipped_products": skipped,
            "accuracy": _round(overall_accuracy),
            "wape": _round(overall_wape),
            "bias": _round(signed_error / evaluated_units if evaluated_units else None),
            "evaluated_units": int(evaluated_units),
            "evaluated_until": end_week.isoformat() if end_week else None,
            "by_status": {
                status: sum(1 for item in items if item["status"] == status)
                for status in ("GOOD", "FAIR", "POOR")
            },
        },
        "model": {
            "name": MODEL_NAME,
            "description": MODEL_DESCRIPTION,
            "granularity": "WEEKLY",
            "window_weeks": WINDOW,
            "evaluation_weeks": EVALUATION_WEEKS,
            "interval_confidence": 0.95,
            "thresholds": {"good": GOOD_ACCURACY, "fair": FAIR_ACCURACY},
            "source": "OLIST",
            "limitation": (
                "Backtest sobre pedidos históricos da Olist: mede o quanto a previsão "
                "teria acertado, sem sazonalidade nem saldo de estoque. A acurácia é "
                "1 - WAPE (erro absoluto total / venda real total). Produtos com "
                "venda esparsa e picos pontuais têm acurácia naturalmente baixa."
            ),
        },
    }


def product_forecast(
    connection: sqlite3.Connection, product_id: str
) -> dict[str, object] | None:
    end_week = _last_complete_week(connection)
    if end_week is None:
        return None
    row = connection.execute(
        """
        SELECT COALESCE(NULLIF(MAX(p.product_category_name), ''), 'unknown') AS category
        FROM stg_order_items i
        LEFT JOIN stg_products p ON p.product_id = i.product_id
        WHERE i.product_id = ?
        HAVING COUNT(*) > 0
        """,
        (product_id,),
    ).fetchone()
    if row is None:
        return None
    first_week, series = _weekly_demand(connection, [product_id], end_week).get(
        product_id, (None, [])
    )
    result = backtest(series, first_week) if first_week else None
    if result is None:
        return None
    return {
        **_item(product_id, row["category"], series, result),
        "series": [
            {
                "periodStart": week.period_start.isoformat(),
                "actual": week.actual,
                "predicted": _round(week.predicted, 2),
                "lower": _round(week.lower, 2),
                "upper": _round(week.upper, 2),
                "error": _round(week.predicted - week.actual, 2),
            }
            for week in result.weeks
        ],
    }
