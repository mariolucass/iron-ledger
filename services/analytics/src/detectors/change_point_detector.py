from __future__ import annotations

import hashlib
import json
import sqlite3
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from statistics import median


@dataclass(frozen=True)
class MetricRule:
    name: str
    label: str
    relative_change: float | None
    absolute_change: float
    floor: float
    zero_fill: bool = False


RULES = (
    MetricRule("orders", "pedidos", 0.50, 3.0, 1.0, True),
    MetricRule("units_sold", "unidades vendidas", 0.50, 3.0, 1.0, True),
    MetricRule("revenue", "receita", 0.50, 100.0, 50.0, True),
    MetricRule("cancellation_rate", "taxa de cancelamento", None, 0.10, 0.03),
    MetricRule("unavailable_rate", "taxa de indisponibilidade", None, 0.05, 0.02),
    MetricRule("delayed_delivery_rate", "taxa de entregas atrasadas", None, 0.10, 0.03),
    MetricRule("average_delivery_hours", "prazo medio de entrega", 0.25, 12.0, 6.0),
    MetricRule("average_review_score", "avaliacao media", None, 0.50, 0.20),
)


def _mad(values: list[float]) -> float:
    center = median(values)
    return median(abs(value - center) for value in values)


def _severity(score: float, relative_effect: float) -> str:
    combined = score + min(relative_effect, 2.0)
    if combined >= 6.0:
        return "CRITICAL"
    if combined >= 4.5:
        return "HIGH"
    if combined >= 3.5:
        return "MEDIUM"
    return "LOW"


def _classification(previous: float, current: float, floor: float) -> str:
    if previous <= 0 < current:
        return "ACTIVATION"
    if current <= floor or (previous > 0 and current <= previous * 0.20):
        return "POSSIBLE_INTERRUPTION"
    return "GROWTH" if current > previous else "DECLINE"


def _weeks(start: date, end: date):
    current = start
    while current <= end:
        yield current.isoformat()
        current += timedelta(days=7)


def _explanation(label: str, previous: float, current: float, weeks: int) -> str:
    direction = "aumentou" if current > previous else "diminuiu"
    return (
        f"{label.capitalize()} {direction} de {previous:.2f} para {current:.2f} "
        f"e permaneceu no novo patamar por {weeks} semanas."
    )


def detect_inflection_points(
    connection: sqlite3.Connection,
    baseline_weeks: int = 8,
    current_weeks: int = 3,
    minimum_score: float = 2.5,
) -> int:
    rows = connection.execute(
        """
        SELECT * FROM weekly_business_observations
        ORDER BY seller_id, product_category, period_start
        """
    ).fetchall()
    grouped: dict[tuple[str, str], list[sqlite3.Row]] = defaultdict(list)
    for row in rows:
        grouped[(row["seller_id"], row["product_category"])].append(row)

    results: list[tuple[object, ...]] = []
    for (seller_id, category), observations in grouped.items():
        first = date.fromisoformat(observations[0]["period_start"])
        last = date.fromisoformat(observations[-1]["period_start"])
        by_week = {row["period_start"]: row for row in observations}
        periods = list(_weeks(first, last))
        order_support = [
            int(by_week[period]["orders"]) if period in by_week else 0
            for period in periods
        ]

        for rule in RULES:
            series: list[float | None] = []
            for period in periods:
                row = by_week.get(period)
                if row is None:
                    series.append(0.0 if rule.zero_fill else None)
                else:
                    value = row[rule.name]
                    series.append(float(value) if value is not None else None)

            best: dict[str, object] | None = None
            for boundary in range(baseline_weeks, len(series) - current_weeks + 1):
                prior = series[boundary - baseline_weeks : boundary]
                current_window = series[boundary : boundary + current_weeks]
                if any(value is None for value in prior + current_window):
                    continue

                prior_values = [float(value) for value in prior if value is not None]
                current_values = [
                    float(value) for value in current_window if value is not None
                ]
                previous_value = median(prior_values)
                current_value = median(current_values)
                absolute_change = current_value - previous_value

                # A first sale after an inactive baseline is an activation, not
                # an operational inflection. A separate lifecycle detector can
                # classify activations in a future increment.
                if rule.zero_fill and previous_value <= 0:
                    continue

                relative_effect = abs(absolute_change) / max(
                    abs(previous_value), rule.floor
                )
                robust_scale = max(1.4826 * _mad(prior_values), rule.floor)
                robust_score = abs(absolute_change) / robust_scale

                relative_ok = (
                    rule.relative_change is None
                    or relative_effect >= rule.relative_change
                )
                if (
                    abs(absolute_change) < rule.absolute_change
                    or not relative_ok
                    or robust_score < minimum_score
                ):
                    continue

                strength = robust_score + min(relative_effect, 2.0)
                if best is None or strength > float(best["strength"]):
                    best = {
                        "strength": strength,
                        "detected_at": periods[boundary],
                        "previous": previous_value,
                        "current": current_value,
                        "absolute": absolute_change,
                        "relative": relative_effect,
                        "score": robust_score,
                        "baseline": prior_values,
                        "window": current_values,
                    }

            if best is None:
                continue

            detected_at = str(best["detected_at"])
            boundary = periods.index(detected_at)
            baseline_orders = sum(order_support[boundary - baseline_weeks : boundary])
            current_orders = sum(order_support[boundary : boundary + current_weeks])
            natural_key = f"OLIST|{seller_id}|{category}|{rule.name}|{detected_at}"
            point_id = hashlib.sha256(natural_key.encode("utf-8")).hexdigest()
            previous_value = float(best["previous"])
            current_value = float(best["current"])
            relative_effect = float(best["relative"])
            score = float(best["score"])
            support_factor = min((baseline_orders + current_orders) / 40.0, 1.0)
            confidence = min(
                0.95,
                0.35
                + min(score, 5.0) * 0.06
                + min(relative_effect, 1.0) * 0.10
                + support_factor * 0.20,
            )
            entity_id = f"{seller_id}:{category}"
            evidence = json.dumps(
                {
                    "method": "median_mad_persistent_window",
                    "baselineWeeks": baseline_weeks,
                    "currentWeeks": current_weeks,
                    "baselineValues": best["baseline"],
                    "currentValues": best["window"],
                    "baselineOrders": baseline_orders,
                    "currentOrders": current_orders,
                    "confidenceMeaning": "Indice heuristico de forca e suporte do sinal; nao e probabilidade estatistica.",
                    "limitation": "Associacao observacional; nao comprova causalidade ou ruptura fisica de estoque.",
                },
                ensure_ascii=False,
            )
            results.append(
                (
                    point_id,
                    "Analytics.InflectionPointDetected",
                    detected_at,
                    "SELLER_CATEGORY",
                    entity_id,
                    seller_id,
                    category,
                    rule.name,
                    previous_value,
                    current_value,
                    float(best["absolute"]),
                    relative_effect * 100.0,
                    score,
                    confidence,
                    _severity(score, relative_effect),
                    _classification(previous_value, current_value, rule.floor),
                    _explanation(
                        rule.label, previous_value, current_value, current_weeks
                    ),
                    evidence,
                    "OLIST",
                )
            )

    with connection:
        connection.execute("DELETE FROM inflection_points WHERE source = 'OLIST'")
        connection.executemany(
            """
            INSERT INTO inflection_points (
                id, event_name, detected_at, entity_type, entity_id, seller_id,
                product_category, metric, previous_value, current_value,
                absolute_change, change_percentage, robust_score, confidence,
                severity, classification, explanation, evidence, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            results,
        )
    return len(results)
