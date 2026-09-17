from __future__ import annotations

import csv
import sys
from datetime import datetime, timedelta
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from src.pipeline import run_pipeline
from src.repository import list_inflection_points, summary
from src.storage import connect


def _write(path: Path, headers: list[str], rows: list[list[object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as target:
        writer = csv.writer(target)
        writer.writerow(headers)
        writer.writerows(rows)


def _fixture(data_dir: Path) -> None:
    data_dir.mkdir(parents=True)
    _write(
        data_dir / "olist_products_dataset.csv",
        ["product_id", "product_category_name"],
        [["product-1", "ferramentas"]],
    )
    _write(
        data_dir / "olist_sellers_dataset.csv",
        ["seller_id", "seller_zip_code_prefix", "seller_city", "seller_state"],
        [["seller-1", "01001", "sao paulo", "SP"]],
    )

    orders: list[list[object]] = []
    items: list[list[object]] = []
    reviews: list[list[object]] = []
    start = datetime(2018, 1, 1, 10, 0, 0)
    item_number = 0
    for week in range(14):
        weekly_orders = 2 if week < 10 else 12
        for occurrence in range(weekly_orders):
            item_number += 1
            order_id = f"order-{item_number}"
            purchased = start + timedelta(weeks=week, hours=occurrence)
            approved = purchased + timedelta(hours=2)
            delivered = purchased + timedelta(days=4 if week < 10 else 9)
            estimated = purchased + timedelta(days=7)
            orders.append(
                [
                    order_id,
                    f"customer-{item_number}",
                    "delivered",
                    purchased.isoformat(sep=" "),
                    approved.isoformat(sep=" "),
                    (purchased + timedelta(days=1)).isoformat(sep=" "),
                    delivered.isoformat(sep=" "),
                    estimated.isoformat(sep=" "),
                ]
            )
            items.append(
                [order_id, 1, "product-1", "seller-1", "", 100.0, 10.0]
            )
            reviews.append(
                [
                    f"review-{item_number}",
                    order_id,
                    5 if week < 10 else 2,
                    delivered.date().isoformat(),
                    delivered.isoformat(sep=" "),
                ]
            )

    _write(
        data_dir / "olist_orders_dataset.csv",
        [
            "order_id",
            "customer_id",
            "order_status",
            "order_purchase_timestamp",
            "order_approved_at",
            "order_delivered_carrier_date",
            "order_delivered_customer_date",
            "order_estimated_delivery_date",
        ],
        orders,
    )
    _write(
        data_dir / "olist_order_items_dataset.csv",
        [
            "order_id",
            "order_item_id",
            "product_id",
            "seller_id",
            "shipping_limit_date",
            "price",
            "freight_value",
        ],
        items,
    )
    _write(
        data_dir / "olist_order_reviews_dataset.csv",
        [
            "review_id",
            "order_id",
            "review_score",
            "review_creation_date",
            "review_answer_timestamp",
        ],
        reviews,
    )


def test_pipeline_detects_persistent_change_and_writes_report(tmp_path: Path) -> None:
    raw = tmp_path / "raw"
    database = tmp_path / "analytics.db"
    report = tmp_path / "quality.md"
    _fixture(raw)

    result = run_pipeline(raw, database, report)

    assert result.observations == 14
    assert result.inflection_points >= 3
    assert report.exists()
    report_text = report.read_text(encoding="utf-8")
    assert "Limitacoes" in report_text
    assert "olist_orders_dataset.csv" in report_text

    connection = connect(database)
    try:
        points = list_inflection_points(connection, seller_id="seller-1")
        metrics = {point["metric"] for point in points}
        assert "orders" in metrics
        assert "average_review_score" in metrics
        assert summary(connection)["observations"] == 14
    finally:
        connection.close()
