from __future__ import annotations

import csv
import hashlib
import sqlite3
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CsvSpec:
    filename: str
    table: str
    columns: tuple[str, ...]
    numeric_columns: frozenset[str] = frozenset()


SPECS = (
    CsvSpec(
        "olist_orders_dataset.csv",
        "stg_orders",
        (
            "order_id",
            "customer_id",
            "order_status",
            "order_purchase_timestamp",
            "order_approved_at",
            "order_delivered_carrier_date",
            "order_delivered_customer_date",
            "order_estimated_delivery_date",
        ),
    ),
    CsvSpec(
        "olist_order_items_dataset.csv",
        "stg_order_items",
        (
            "order_id",
            "order_item_id",
            "product_id",
            "seller_id",
            "shipping_limit_date",
            "price",
            "freight_value",
        ),
        frozenset({"order_item_id", "price", "freight_value"}),
    ),
    CsvSpec(
        "olist_products_dataset.csv",
        "stg_products",
        ("product_id", "product_category_name"),
    ),
    CsvSpec(
        "olist_sellers_dataset.csv",
        "stg_sellers",
        ("seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"),
    ),
    CsvSpec(
        "olist_order_reviews_dataset.csv",
        "stg_reviews",
        (
            "review_id",
            "order_id",
            "review_score",
            "review_creation_date",
            "review_answer_timestamp",
        ),
        frozenset({"review_score"}),
    ),
)


class MissingDatasetError(FileNotFoundError):
    pass


def validate_dataset(data_dir: Path) -> None:
    missing = [
        spec.filename for spec in SPECS if not (data_dir / spec.filename).is_file()
    ]
    if missing:
        joined = ", ".join(missing)
        raise MissingDatasetError(
            f"Arquivos obrigatorios da Olist ausentes em {data_dir}: {joined}"
        )

    for spec in SPECS:
        with (data_dir / spec.filename).open(
            "r", encoding="utf-8-sig", newline=""
        ) as source:
            headers = set(next(csv.reader(source)))
        missing_columns = set(spec.columns) - headers
        if missing_columns:
            raise ValueError(
                f"{spec.filename} nao contem as colunas: {sorted(missing_columns)}"
            )


def _coerce(value: str | None, numeric: bool) -> object:
    if value is None or value == "":
        return None
    if not numeric:
        return value.strip()
    try:
        return float(value)
    except ValueError as error:
        raise ValueError(f"Valor numerico invalido: {value!r}") from error


def _batches(rows: Iterable[tuple[object, ...]], size: int = 5_000):
    batch: list[tuple[object, ...]] = []
    for row in rows:
        batch.append(row)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def load_olist(connection: sqlite3.Connection, data_dir: Path) -> dict[str, int]:
    validate_dataset(data_dir)
    counts: dict[str, int] = {}

    with connection:
        for spec in SPECS:
            connection.execute(f"DELETE FROM {spec.table}")
            path = data_dir / spec.filename
            placeholders = ", ".join("?" for _ in spec.columns)
            columns_sql = ", ".join(spec.columns)
            insert_sql = (
                f"INSERT INTO {spec.table} ({columns_sql}) VALUES ({placeholders})"
            )
            count = 0

            with path.open("r", encoding="utf-8-sig", newline="") as source:
                reader = csv.DictReader(source)
                converted = (
                    tuple(
                        _coerce(row.get(column), column in spec.numeric_columns)
                        for column in spec.columns
                    )
                    for row in reader
                )
                for batch in _batches(converted):
                    connection.executemany(insert_sql, batch)
                    count += len(batch)

            counts[spec.filename] = count
            connection.execute(
                """
                INSERT INTO source_file_stats(file_name, row_count, imported_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(file_name) DO UPDATE SET
                    row_count = excluded.row_count,
                    imported_at = excluded.imported_at
                """,
                (spec.filename, count),
            )

    return counts


def build_weekly_observations(connection: sqlite3.Connection) -> int:
    connection.execute("DELETE FROM weekly_business_observations")
    connection.executescript(
        """
        DROP TABLE IF EXISTS temp.review_by_order;
        CREATE TEMP TABLE review_by_order AS
        SELECT order_id, AVG(review_score) AS average_review_score
        FROM stg_reviews
        GROUP BY order_id;

        DROP TABLE IF EXISTS temp.weekly_build;
        CREATE TEMP TABLE weekly_build AS
        SELECT
            i.seller_id,
            MAX(s.seller_state) AS seller_state,
            COALESCE(NULLIF(p.product_category_name, ''), 'unknown') AS product_category,
            date(
                substr(o.order_purchase_timestamp, 1, 10),
                '-' || ((CAST(strftime('%w', substr(o.order_purchase_timestamp, 1, 10)) AS INTEGER) + 6) % 7) || ' days'
            ) AS period_start,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(*) AS units_sold,
            SUM(COALESCE(i.price, 0)) AS revenue,
            SUM(COALESCE(i.freight_value, 0)) AS freight_value,
            AVG(CASE WHEN lower(o.order_status) IN ('canceled', 'unavailable') THEN 1.0 ELSE 0.0 END) AS cancellation_rate,
            AVG(CASE WHEN lower(o.order_status) = 'unavailable' THEN 1.0 ELSE 0.0 END) AS unavailable_rate,
            AVG(CASE
                WHEN o.order_delivered_customer_date IS NULL OR o.order_estimated_delivery_date IS NULL THEN NULL
                WHEN julianday(o.order_delivered_customer_date) > julianday(o.order_estimated_delivery_date) THEN 1.0
                ELSE 0.0
            END) AS delayed_delivery_rate,
            AVG(CASE
                WHEN o.order_approved_at IS NULL THEN NULL
                ELSE (julianday(o.order_approved_at) - julianday(o.order_purchase_timestamp)) * 24.0
            END) AS average_approval_hours,
            AVG(CASE
                WHEN o.order_delivered_customer_date IS NULL THEN NULL
                ELSE (julianday(o.order_delivered_customer_date) - julianday(o.order_purchase_timestamp)) * 24.0
            END) AS average_delivery_hours,
            AVG(r.average_review_score) AS average_review_score,
            (
                (CASE WHEN s.seller_id IS NULL THEN 0.0 ELSE 1.0 END) +
                (CASE WHEN p.product_id IS NULL THEN 0.0 ELSE 1.0 END) +
                (CASE WHEN o.order_purchase_timestamp IS NULL THEN 0.0 ELSE 1.0 END) +
                (CASE WHEN i.price IS NULL THEN 0.0 ELSE 1.0 END)
            ) / 4.0 AS data_quality
        FROM stg_order_items i
        JOIN stg_orders o ON o.order_id = i.order_id
        LEFT JOIN stg_products p ON p.product_id = i.product_id
        LEFT JOIN stg_sellers s ON s.seller_id = i.seller_id
        LEFT JOIN review_by_order r ON r.order_id = o.order_id
        WHERE o.order_purchase_timestamp IS NOT NULL
        GROUP BY i.seller_id, product_category, period_start;
        """
    )

    rows = connection.execute("SELECT * FROM weekly_build").fetchall()
    payload = []
    for row in rows:
        natural_key = (
            f"OLIST|{row['seller_id']}|{row['product_category']}|{row['period_start']}"
        )
        observation_id = hashlib.sha256(natural_key.encode("utf-8")).hexdigest()
        payload.append((observation_id, "OLIST", *tuple(row)))

    connection.executemany(
        """
        INSERT INTO weekly_business_observations (
            observation_id, source, seller_id, seller_state, product_category,
            period_start, orders, units_sold, revenue, freight_value,
            cancellation_rate, unavailable_rate, delayed_delivery_rate,
            average_approval_hours, average_delivery_hours, average_review_score,
            data_quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        payload,
    )
    connection.commit()
    return len(payload)
