from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from src.forecasting import (
    EVALUATION_WEEKS,
    MIN_WEEKS,
    WINDOW,
    accuracy_status,
    backtest,
    forecast_accuracy,
    product_forecast,
)
from src.storage import connect

FIRST_WEEK = date(2018, 1, 1)  # segunda-feira


class BacktestTest(unittest.TestCase):
    def test_constant_demand_is_perfectly_predicted(self) -> None:
        result = backtest([10] * 30, FIRST_WEEK)
        assert result is not None
        self.assertEqual(len(result.weeks), EVALUATION_WEEKS)
        self.assertEqual(result.wape, 0.0)
        self.assertEqual(result.accuracy, 1.0)
        self.assertEqual(result.bias, 0.0)
        self.assertEqual(result.next_predicted, 10)

    def test_error_metrics_follow_the_definition(self) -> None:
        # Seis semanas de 10 e depois um degrau para 20: a média móvel subestima.
        series = [10] * 20 + [20] * 10
        result = backtest(series, FIRST_WEEK)
        assert result is not None
        self.assertAlmostEqual(
            result.wape, result.absolute_error / result.evaluated_units
        )
        self.assertLess(result.bias, 0)  # previu menos do que vendeu
        self.assertAlmostEqual(result.accuracy, 1 - result.wape)

    def test_each_week_is_predicted_only_with_prior_weeks(self) -> None:
        series = list(range(1, 31))
        result = backtest(series, FIRST_WEEK)
        assert result is not None
        for week in result.weeks:
            index = (week.period_start - FIRST_WEEK).days // 7
            expected = sum(series[index - WINDOW : index]) / WINDOW
            self.assertEqual(week.predicted, expected)
            self.assertEqual(week.actual, series[index])

    def test_next_forecast_starts_after_the_last_week(self) -> None:
        result = backtest([3] * 30, FIRST_WEEK)
        assert result is not None
        self.assertEqual(result.next_period_start, FIRST_WEEK + timedelta(weeks=30))

    def test_accuracy_never_goes_negative(self) -> None:
        result = backtest([0] * 20 + [1] * 5 + [50] * 5, FIRST_WEEK)
        assert result is not None
        self.assertGreaterEqual(result.accuracy, 0.0)

    def test_short_history_has_no_backtest(self) -> None:
        self.assertIsNone(backtest([5] * (MIN_WEEKS - 1), FIRST_WEEK))

    def test_no_sales_in_window_has_no_accuracy(self) -> None:
        result = backtest([5] * 20 + [0] * 12, FIRST_WEEK)
        assert result is not None
        self.assertIsNone(result.accuracy)
        self.assertEqual(accuracy_status(result.accuracy), "UNKNOWN")

    def test_status_thresholds(self) -> None:
        self.assertEqual(accuracy_status(0.85), "GOOD")
        self.assertEqual(accuracy_status(0.7), "FAIR")
        self.assertEqual(accuracy_status(0.3), "POOR")


class ForecastAccuracyQueryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = connect(":memory:")
        orders, items = [], []
        start = date(2018, 1, 1)
        # product-a vende 3 un. por semana durante 32 semanas; product-b só 2 semanas.
        for week in range(32):
            for unit in range(3):
                order_id = f"a-{week}-{unit}"
                day = (start + timedelta(weeks=week, days=unit)).isoformat()
                orders.append((order_id, "delivered", f"{day} 10:00:00"))
                items.append((order_id, "product-a"))
        for week in range(2):
            order_id = f"b-{week}"
            day = (start + timedelta(weeks=week)).isoformat()
            orders.append((order_id, "delivered", f"{day} 10:00:00"))
            items.append((order_id, "product-b"))
        self.connection.executemany(
            "INSERT INTO stg_orders(order_id, order_status, order_purchase_timestamp) "
            "VALUES (?, ?, ?)",
            orders,
        )
        self.connection.executemany(
            "INSERT INTO stg_order_items(order_id, product_id) VALUES (?, ?)", items
        )
        self.connection.execute(
            "INSERT INTO stg_products(product_id, product_category_name) "
            "VALUES ('product-a', 'ferramentas')"
        )
        self.connection.commit()

    def tearDown(self) -> None:
        self.connection.close()

    def test_lists_only_products_with_enough_history(self) -> None:
        # product-b nem vendeu na janela avaliada, então nem é candidato.
        result = forecast_accuracy(self.connection)
        self.assertEqual([item["product_id"] for item in result["items"]], ["product-a"])
        item = result["items"][0]
        self.assertEqual(item["category"], "ferramentas")
        self.assertEqual(item["accuracy"], 1.0)
        self.assertEqual(item["status"], "GOOD")
        self.assertEqual(result["summary"]["accuracy"], 1.0)

    def test_filters_by_category_and_search(self) -> None:
        self.assertEqual(
            forecast_accuracy(self.connection, category="outra")["items"], []
        )
        self.assertEqual(
            len(forecast_accuracy(self.connection, search="ferram")["items"]), 1
        )

    def test_detail_returns_weekly_series(self) -> None:
        detail = product_forecast(self.connection, "product-a")
        assert detail is not None
        self.assertEqual(len(detail["series"]), EVALUATION_WEEKS)
        self.assertEqual(detail["series"][0]["actual"], 3)
        # Sem venda na janela avaliada não há acurácia a medir.
        idle = product_forecast(self.connection, "product-b")
        assert idle is not None
        self.assertIsNone(idle["accuracy"])
        self.assertIsNone(product_forecast(self.connection, "missing"))


if __name__ == "__main__":
    unittest.main()
