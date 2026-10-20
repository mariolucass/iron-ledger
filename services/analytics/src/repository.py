from __future__ import annotations

import json
import sqlite3
from datetime import date, timedelta

from src.detectors.change_point_detector import RULES
from src.metrics import CLASSIFICATIONS, METRICS, SEVERITIES, impact

ALLOWED_SEVERITIES = set(SEVERITIES)
ALLOWED_IMPACTS = {"POSITIVE", "NEGATIVE"}
WEEKS_AFTER_WINDOW = 4

_ZERO_FILL = {rule.name for rule in RULES if rule.zero_fill}
_HIGHER_IS_BETTER = tuple(name for name, info in METRICS.items() if info.higher_is_better)


def _filters(
    *,
    seller_id: str | None,
    metric: str | None,
    severity: str | None,
    classification: str | None,
    impact_filter: str | None,
) -> tuple[str, list[object]]:
    clauses: list[str] = []
    parameters: list[object] = []
    if seller_id:
        clauses.append("seller_id = ?")
        parameters.append(seller_id)
    if metric:
        if metric not in METRICS:
            raise ValueError(f"Metrica invalida: {metric}")
        clauses.append("metric = ?")
        parameters.append(metric)
    if severity:
        normalized = severity.upper()
        if normalized not in ALLOWED_SEVERITIES:
            raise ValueError(f"Severidade invalida: {severity}")
        clauses.append("severity = ?")
        parameters.append(normalized)
    if classification:
        normalized = classification.upper()
        if normalized not in CLASSIFICATIONS:
            raise ValueError(f"Classificacao invalida: {classification}")
        clauses.append("classification = ?")
        parameters.append(normalized)
    if impact_filter:
        normalized = impact_filter.upper()
        if normalized not in ALLOWED_IMPACTS:
            raise ValueError(f"Impacto invalido: {impact_filter}")
        # Positivo = subiu uma metrica em que mais e melhor, ou caiu uma em que menos e melhor.
        placeholders = ", ".join("?" for _ in _HIGHER_IS_BETTER)
        positive = f"((absolute_change > 0) = (metric IN ({placeholders})))"
        clauses.append(positive if normalized == "POSITIVE" else f"NOT {positive}")
        clauses.append("absolute_change <> 0")
        parameters.extend(_HIGHER_IS_BETTER)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return where, parameters


def list_inflection_points(
    connection: sqlite3.Connection,
    *,
    seller_id: str | None = None,
    metric: str | None = None,
    severity: str | None = None,
    classification: str | None = None,
    impact_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    where, parameters = _filters(
        seller_id=seller_id,
        metric=metric,
        severity=severity,
        classification=classification,
        impact_filter=impact_filter,
    )
    rows = connection.execute(
        f"""
        SELECT * FROM inflection_points
        {where}
        ORDER BY detected_at DESC, robust_score DESC
        LIMIT ? OFFSET ?
        """,
        (*parameters, min(max(limit, 1), 500), max(offset, 0)),
    ).fetchall()
    return [_serialize(row) for row in rows]


def count_inflection_points(
    connection: sqlite3.Connection,
    *,
    seller_id: str | None = None,
    metric: str | None = None,
    severity: str | None = None,
    classification: str | None = None,
    impact_filter: str | None = None,
) -> int:
    where, parameters = _filters(
        seller_id=seller_id,
        metric=metric,
        severity=severity,
        classification=classification,
        impact_filter=impact_filter,
    )
    return connection.execute(
        f"SELECT COUNT(*) FROM inflection_points {where}", parameters
    ).fetchone()[0]


def get_inflection_point(
    connection: sqlite3.Connection, point_id: str
) -> dict[str, object] | None:
    row = connection.execute(
        "SELECT * FROM inflection_points WHERE id = ?", (point_id,)
    ).fetchone()
    if row is None:
        return None
    result = _serialize(row)
    state = connection.execute(
        "SELECT seller_state FROM weekly_business_observations WHERE seller_id = ? LIMIT 1",
        (row["seller_id"],),
    ).fetchone()
    result["seller_state"] = state["seller_state"] if state else None
    result["series"] = _series(connection, result)
    return result


def _series(
    connection: sqlite3.Connection, point: dict[str, object]
) -> list[dict[str, object]]:
    """Serie semanal da metrica em torno do ponto: referencia, janela atual e depois."""
    evidence = point["evidence"]
    baseline_weeks = int(evidence.get("baselineWeeks", 8))
    current_weeks = int(evidence.get("currentWeeks", 3))
    detected = date.fromisoformat(str(point["detected_at"]))
    start = detected - timedelta(weeks=baseline_weeks)
    end = detected + timedelta(weeks=current_weeks + WEEKS_AFTER_WINDOW - 1)
    metric = str(point["metric"])
    if metric not in METRICS:
        return []

    rows = connection.execute(
        f"""
        SELECT period_start, orders, {metric} AS value
        FROM weekly_business_observations
        WHERE seller_id = ? AND product_category = ?
          AND period_start BETWEEN ? AND ?
        """,
        (point["seller_id"], point["product_category"], start.isoformat(), end.isoformat()),
    ).fetchall()
    by_week = {row["period_start"]: row for row in rows}
    current_end = detected + timedelta(weeks=current_weeks)

    series: list[dict[str, object]] = []
    week = start
    while week <= end:
        row = by_week.get(week.isoformat())
        if row is not None:
            value = row["value"]
        else:
            value = 0.0 if metric in _ZERO_FILL else None
        series.append(
            {
                "periodStart": week.isoformat(),
                "value": value,
                "orders": row["orders"] if row is not None else 0,
                "window": "baseline"
                if week < detected
                else "current"
                if week < current_end
                else "after",
            }
        )
        week += timedelta(weeks=1)
    return series


def summary(connection: sqlite3.Connection) -> dict[str, object]:
    totals = connection.execute(
        """
        SELECT
            COUNT(*) AS total,
            COUNT(DISTINCT seller_id) AS sellers,
            COUNT(DISTINCT product_category) AS categories,
            MIN(detected_at) AS first_detection,
            MAX(detected_at) AS last_detection
        FROM inflection_points
        """
    ).fetchone()
    severities = {
        row["severity"]: row["total"]
        for row in connection.execute(
            "SELECT severity, COUNT(*) AS total FROM inflection_points GROUP BY severity"
        )
    }
    classifications = {
        row["classification"]: row["total"]
        for row in connection.execute(
            """
            SELECT classification, COUNT(*) AS total FROM inflection_points
            WHERE classification IS NOT NULL GROUP BY classification
            """
        )
    }
    by_metric: dict[str, dict[str, object]] = {}
    impacts = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
    for row in connection.execute(
        """
        SELECT
            metric,
            CASE WHEN absolute_change > 0 THEN 1 WHEN absolute_change < 0 THEN -1 ELSE 0 END
                AS direction,
            COUNT(*) AS total
        FROM inflection_points GROUP BY metric, direction
        """
    ):
        metric = row["metric"]
        info = METRICS.get(metric)
        entry = by_metric.setdefault(
            metric,
            {
                "metric": metric,
                "label": info.label if info else metric,
                "total": 0,
                "positive": 0,
                "negative": 0,
            },
        )
        kind = impact(metric, float(row["direction"]))
        entry["total"] = int(entry["total"]) + row["total"]
        if kind == "POSITIVE":
            entry["positive"] = int(entry["positive"]) + row["total"]
        elif kind == "NEGATIVE":
            entry["negative"] = int(entry["negative"]) + row["total"]
        impacts[kind] += row["total"]

    observations = connection.execute(
        """
        SELECT
            COUNT(*) AS total,
            COUNT(DISTINCT seller_id) AS sellers,
            MIN(period_start) AS first_week,
            MAX(period_start) AS last_week
        FROM weekly_business_observations
        """
    ).fetchone()
    return {
        "observations": observations["total"],
        "observedSellers": observations["sellers"],
        "observationPeriod": {
            "start": observations["first_week"],
            "end": observations["last_week"],
        },
        "inflectionPoints": totals["total"],
        "sellers": totals["sellers"],
        "categories": totals["categories"],
        "firstDetection": totals["first_detection"],
        "lastDetection": totals["last_detection"],
        "bySeverity": severities,
        "byClassification": classifications,
        "byImpact": impacts,
        "byMetric": sorted(by_metric.values(), key=lambda item: -int(item["total"])),
        "method": "median_mad_persistent_window",
        "source": "OLIST",
    }


def _serialize(row: sqlite3.Row) -> dict[str, object]:
    result = dict(row)
    result["evidence"] = json.loads(str(result["evidence"]))
    info = METRICS.get(str(result["metric"]))
    change = float(result["absolute_change"])
    result["metric_label"] = info.label if info else result["metric"]
    result["metric_description"] = info.description if info else None
    result["unit"] = info.unit if info else None
    result["higher_is_better"] = info.higher_is_better if info else None
    result["what_to_check"] = info.what_to_check if info else None
    result["direction"] = "UP" if change > 0 else "DOWN" if change < 0 else "FLAT"
    result["impact"] = impact(str(result["metric"]), change)
    result["severity_label"] = SEVERITIES.get(str(result["severity"]), result["severity"])
    classification = result.get("classification")
    result["classification_label"] = (
        CLASSIFICATIONS.get(str(classification)) if classification else None
    )
    return result
