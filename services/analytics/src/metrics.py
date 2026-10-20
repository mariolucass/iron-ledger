"""Catalogo de metricas e rotulos usados para tornar os sinais legiveis.

O detector trabalha com nomes tecnicos (``cancellation_rate``). Este modulo
traduz esses nomes para o que uma pessoa de operacao precisa saber: o que a
metrica mede, em que unidade, se subir e bom ou ruim e o que verificar quando
ela muda.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class MetricInfo:
    name: str
    label: str
    description: str
    unit: str  # count | currency | ratio | hours | score
    higher_is_better: bool
    what_to_check: str


METRICS: dict[str, MetricInfo] = {
    info.name: info
    for info in (
        MetricInfo(
            "orders",
            "Pedidos",
            "Quantidade de pedidos distintos do vendedor na categoria, por semana.",
            "count",
            True,
            "Queda: verifique ruptura de estoque, anuncio pausado ou preco fora do mercado. "
            "Alta: confirme se o estoque e a reposicao acompanham a nova demanda.",
        ),
        MetricInfo(
            "units_sold",
            "Unidades vendidas",
            "Itens vendidos (linhas de pedido) do vendedor na categoria, por semana.",
            "count",
            True,
            "Compare com o saldo disponivel: um novo patamar de vendas muda o ponto de "
            "reposicao e o estoque de seguranca.",
        ),
        MetricInfo(
            "revenue",
            "Receita",
            "Soma do preco dos itens vendidos na semana (sem frete), em reais.",
            "currency",
            True,
            "Separe efeito de volume (mais pedidos) de efeito de preco (ticket medio).",
        ),
        MetricInfo(
            "cancellation_rate",
            "Taxa de cancelamento",
            "Fracao dos pedidos da semana cancelados ou marcados como indisponiveis.",
            "ratio",
            False,
            "Alta: investigue falta de produto, atraso na aprovacao ou problema de pagamento.",
        ),
        MetricInfo(
            "unavailable_rate",
            "Taxa de indisponibilidade",
            "Fracao dos pedidos encerrados porque o produto estava indisponivel. "
            "E o sinal mais proximo de ruptura de estoque nos dados da Olist.",
            "ratio",
            False,
            "Alta: provavel venda sem saldo real. Confira o inventario fisico e as reservas.",
        ),
        MetricInfo(
            "delayed_delivery_rate",
            "Taxa de entregas atrasadas",
            "Fracao dos pedidos entregues depois da data estimada.",
            "ratio",
            False,
            "Alta: verifique transportadora, tempo de separacao e eventos sazonais "
            "(feriados afetam muitos vendedores ao mesmo tempo).",
        ),
        MetricInfo(
            "average_delivery_hours",
            "Prazo medio de entrega",
            "Horas entre a compra e a entrega ao cliente, em media.",
            "hours",
            False,
            "Alta: gargalo de expedicao ou logistica. Costuma anteceder piora na avaliacao.",
        ),
        MetricInfo(
            "average_review_score",
            "Avaliacao media",
            "Nota media (1 a 5) dada pelos clientes aos pedidos da semana.",
            "score",
            True,
            "Queda: leia as avaliacoes e cruze com atraso e cancelamento do mesmo periodo.",
        ),
    )
}

SEVERITIES: dict[str, str] = {
    "LOW": "Baixa",
    "MEDIUM": "Media",
    "HIGH": "Alta",
    "CRITICAL": "Critica",
}

CLASSIFICATIONS: dict[str, str] = {
    "GROWTH": "Crescimento",
    "DECLINE": "Queda",
    "POSSIBLE_INTERRUPTION": "Possivel interrupcao",
    "ACTIVATION": "Ativacao",
}


def metric_catalog() -> list[dict[str, object]]:
    return [asdict(info) for info in METRICS.values()]


def impact(metric: str, absolute_change: float) -> str:
    """POSITIVE quando a mudanca e boa para o negocio, NEGATIVE quando e ruim."""
    info = METRICS.get(metric)
    if info is None or absolute_change == 0:
        return "NEUTRAL"
    improved = (absolute_change > 0) == info.higher_is_better
    return "POSITIVE" if improved else "NEGATIVE"
