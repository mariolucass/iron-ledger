from __future__ import annotations

import sqlite3
from pathlib import Path


def _scalar(connection: sqlite3.Connection, sql: str) -> int | float | str | None:
    return connection.execute(sql).fetchone()[0]


def collect_quality_metrics(connection: sqlite3.Connection) -> dict[str, object]:
    source_files = {
        row["file_name"]: row["row_count"]
        for row in connection.execute(
            "SELECT file_name, row_count FROM source_file_stats ORDER BY file_name"
        )
    }
    checks = {
        "duplicate_orders": _scalar(
            connection,
            "SELECT COUNT(*) - COUNT(DISTINCT order_id) FROM stg_orders",
        ),
        "duplicate_products": _scalar(
            connection,
            "SELECT COUNT(*) - COUNT(DISTINCT product_id) FROM stg_products",
        ),
        "duplicate_sellers": _scalar(
            connection,
            "SELECT COUNT(*) - COUNT(DISTINCT seller_id) FROM stg_sellers",
        ),
        "orphan_item_orders": _scalar(
            connection,
            """
            SELECT COUNT(*) FROM stg_order_items i
            LEFT JOIN stg_orders o ON o.order_id = i.order_id
            WHERE o.order_id IS NULL
            """,
        ),
        "orphan_item_products": _scalar(
            connection,
            """
            SELECT COUNT(*) FROM stg_order_items i
            LEFT JOIN stg_products p ON p.product_id = i.product_id
            WHERE p.product_id IS NULL
            """,
        ),
        "orphan_item_sellers": _scalar(
            connection,
            """
            SELECT COUNT(*) FROM stg_order_items i
            LEFT JOIN stg_sellers s ON s.seller_id = i.seller_id
            WHERE s.seller_id IS NULL
            """,
        ),
        "orders_without_purchase_date": _scalar(
            connection,
            "SELECT COUNT(*) FROM stg_orders WHERE order_purchase_timestamp IS NULL",
        ),
        "products_without_category": _scalar(
            connection,
            """
            SELECT COUNT(*) FROM stg_products
            WHERE product_category_name IS NULL OR product_category_name = ''
            """,
        ),
    }
    return {
        "source_files": source_files,
        "checks": checks,
        "minimum_purchase_date": _scalar(
            connection, "SELECT MIN(order_purchase_timestamp) FROM stg_orders"
        ),
        "maximum_purchase_date": _scalar(
            connection, "SELECT MAX(order_purchase_timestamp) FROM stg_orders"
        ),
        "observations": _scalar(
            connection, "SELECT COUNT(*) FROM weekly_business_observations"
        ),
        "inflection_points": _scalar(
            connection, "SELECT COUNT(*) FROM inflection_points"
        ),
    }


def write_quality_report(connection: sqlite3.Connection, output_path: Path) -> Path:
    metrics = collect_quality_metrics(connection)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    severity_rows = connection.execute(
        """
        SELECT severity, COUNT(*) AS total
        FROM inflection_points
        GROUP BY severity
        ORDER BY CASE severity
            WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3 ELSE 4 END
        """
    ).fetchall()
    top_points = connection.execute(
        """
        SELECT detected_at, seller_id, product_category, metric, severity,
               previous_value, current_value, confidence
        FROM inflection_points
        ORDER BY robust_score DESC, detected_at DESC
        LIMIT 10
        """
    ).fetchall()

    lines = [
        "# Relatorio de qualidade e analise inicial da Olist",
        "",
        "Este relatorio e gerado pelo pipeline do servico `analytics`. Os CSVs brutos permanecem fora do Git.",
        "",
        "## Cobertura",
        "",
        f"- Inicio observado: `{metrics['minimum_purchase_date'] or 'n.a.'}`",
        f"- Fim observado: `{metrics['maximum_purchase_date'] or 'n.a.'}`",
        f"- Observacoes semanais: **{metrics['observations']}**",
        f"- Pontos de inflexao detectados: **{metrics['inflection_points']}**",
        "",
        "## Arquivos importados",
        "",
        "| Arquivo | Linhas |",
        "| --- | ---: |",
    ]
    for filename, count in dict(metrics["source_files"]).items():
        lines.append(f"| `{filename}` | {count:,} |")

    lines.extend(
        [
            "",
            "## Checagens de qualidade",
            "",
            "| Checagem | Ocorrencias |",
            "| --- | ---: |",
        ]
    )
    for name, value in dict(metrics["checks"]).items():
        lines.append(f"| `{name}` | {value:,} |")

    lines.extend(
        [
            "",
            "## Distribuicao dos sinais",
            "",
            "| Severidade | Total |",
            "| --- | ---: |",
        ]
    )
    if severity_rows:
        for row in severity_rows:
            lines.append(f"| {row['severity']} | {row['total']:,} |")
    else:
        lines.append("| Nenhum sinal | 0 |")

    lines.extend(
        [
            "",
            "## Sinais com maior desvio robusto",
            "",
            "| Data | Vendedor | Categoria | Metrica | Severidade | Antes | Depois | Indice heuristico |",
            "| --- | --- | --- | --- | --- | ---: | ---: | ---: |",
        ]
    )
    if top_points:
        for row in top_points:
            lines.append(
                f"| {row['detected_at']} | `{row['seller_id']}` | "
                f"{row['product_category']} | `{row['metric']}` | {row['severity']} | "
                f"{row['previous_value']:.2f} | {row['current_value']:.2f} | "
                f"{row['confidence']:.1%} |"
            )
    else:
        lines.append("| n.a. | n.a. | n.a. | n.a. | n.a. | n.a. | n.a. | n.a. |")

    lines.extend(
        [
            "",
            "## Metodo",
            "",
            "O detector compara a mediana de oito semanas anteriores com a mediana de uma janela persistente de tres semanas. A escala usa o desvio absoluto mediano (MAD), que reduz a dependencia da hipotese de distribuicao normal. Apenas o sinal mais forte por vendedor, categoria e metrica e mantido nesta primeira versao.",
            "Ativacoes apos um baseline sem vendas nao sao classificadas como pontos de inflexao operacionais.",
            "",
            "## Limitacoes",
            "",
            "- A Olist nao informa saldo, entrada, reserva ou ruptura fisica de estoque.",
            "- `unavailable` e cancelamento sao sinais de risco, nao comprovacao de ruptura.",
            "- Vendedor da Olist nao equivale juridicamente a micro ou pequena empresa.",
            "- Os resultados sao associacoes observacionais e nao demonstram causalidade.",
            "- O indice de confianca combina desvio, efeito e volume observado; ele nao representa probabilidade estatistica.",
            "- Semanas sem venda sao preenchidas com zero somente para metricas aditivas; taxas permanecem ausentes.",
            "- O historico e antigo e deve validar o metodo, nao representar o mercado atual.",
            "",
            "## Fonte",
            "",
            "Brazilian E-Commerce Public Dataset by Olist: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce",
            "",
        ]
    )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
