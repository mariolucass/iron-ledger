from __future__ import annotations

import json
import sqlite3


ALLOWED_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


def list_inflection_points(
    connection: sqlite3.Connection,
    *,
    seller_id: str | None = None,
    metric: str | None = None,
    severity: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, object]]:
    clauses: list[str] = []
    parameters: list[object] = []
    if seller_id:
        clauses.append("seller_id = ?")
        parameters.append(seller_id)
    if metric:
        clauses.append("metric = ?")
        parameters.append(metric)
    if severity:
        normalized = severity.upper()
        if normalized not in ALLOWED_SEVERITIES:
            raise ValueError(f"Severidade invalida: {severity}")
        clauses.append("severity = ?")
        parameters.append(normalized)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
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


def get_inflection_point(
    connection: sqlite3.Connection, point_id: str
) -> dict[str, object] | None:
    row = connection.execute(
        "SELECT * FROM inflection_points WHERE id = ?", (point_id,)
    ).fetchone()
    return _serialize(row) if row else None


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
    observations = connection.execute(
        "SELECT COUNT(*) FROM weekly_business_observations"
    ).fetchone()[0]
    return {
        "observations": observations,
        "inflectionPoints": totals["total"],
        "sellers": totals["sellers"],
        "categories": totals["categories"],
        "firstDetection": totals["first_detection"],
        "lastDetection": totals["last_detection"],
        "bySeverity": severities,
        "method": "median_mad_persistent_window",
    }


def _serialize(row: sqlite3.Row) -> dict[str, object]:
    result = dict(row)
    result["evidence"] = json.loads(str(result["evidence"]))
    return result
