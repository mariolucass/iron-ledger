from __future__ import annotations

import sqlite3
from pathlib import Path


def connect(path: Path | str) -> sqlite3.Connection:
    database = Path(path)
    database.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    migrate(connection)
    return connection


def migrate(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS stg_orders (
            order_id TEXT,
            customer_id TEXT,
            order_status TEXT,
            order_purchase_timestamp TEXT,
            order_approved_at TEXT,
            order_delivered_carrier_date TEXT,
            order_delivered_customer_date TEXT,
            order_estimated_delivery_date TEXT
        );

        CREATE TABLE IF NOT EXISTS stg_order_items (
            order_id TEXT,
            order_item_id INTEGER,
            product_id TEXT,
            seller_id TEXT,
            shipping_limit_date TEXT,
            price REAL,
            freight_value REAL
        );

        CREATE TABLE IF NOT EXISTS stg_products (
            product_id TEXT,
            product_category_name TEXT
        );

        CREATE TABLE IF NOT EXISTS stg_sellers (
            seller_id TEXT,
            seller_zip_code_prefix TEXT,
            seller_city TEXT,
            seller_state TEXT
        );

        CREATE TABLE IF NOT EXISTS stg_reviews (
            review_id TEXT,
            order_id TEXT,
            review_score REAL,
            review_creation_date TEXT,
            review_answer_timestamp TEXT
        );

        CREATE TABLE IF NOT EXISTS source_file_stats (
            file_name TEXT PRIMARY KEY,
            row_count INTEGER NOT NULL,
            imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS weekly_business_observations (
            observation_id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            seller_id TEXT NOT NULL,
            seller_state TEXT,
            product_category TEXT NOT NULL,
            period_start TEXT NOT NULL,
            orders INTEGER NOT NULL,
            units_sold INTEGER NOT NULL,
            revenue REAL NOT NULL,
            freight_value REAL NOT NULL,
            cancellation_rate REAL,
            unavailable_rate REAL,
            delayed_delivery_rate REAL,
            average_approval_hours REAL,
            average_delivery_hours REAL,
            average_review_score REAL,
            data_quality REAL NOT NULL
        );

        CREATE INDEX IF NOT EXISTS observations_entity_period_idx
            ON weekly_business_observations(seller_id, product_category, period_start);

        CREATE TABLE IF NOT EXISTS inflection_points (
            id TEXT PRIMARY KEY,
            event_name TEXT NOT NULL,
            detected_at TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            seller_id TEXT NOT NULL,
            product_category TEXT NOT NULL,
            metric TEXT NOT NULL,
            previous_value REAL NOT NULL,
            current_value REAL NOT NULL,
            absolute_change REAL NOT NULL,
            change_percentage REAL,
            robust_score REAL NOT NULL,
            confidence REAL NOT NULL,
            severity TEXT NOT NULL,
            classification TEXT,
            explanation TEXT NOT NULL,
            evidence TEXT NOT NULL,
            source TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS inflection_points_query_idx
            ON inflection_points(severity, metric, detected_at DESC);
        """
    )
    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(inflection_points)")
    }
    if "classification" not in columns:
        connection.execute(
            "ALTER TABLE inflection_points ADD COLUMN classification TEXT"
        )
    connection.commit()
