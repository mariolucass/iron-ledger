# Primeiro passo analitico com a Olist

## Objetivo

Usar dados historicos reais da Olist para validar um modelo analitico reutilizavel antes de conectar dados operacionais de empresas. O primeiro incremento detecta mudancas persistentes em indicadores de vendedores e categorias e produz evidencias consultaveis.

O resultado representa associacao observacional. Ele nao comprova causalidade, porte empresarial ou ruptura fisica de estoque.

## Quatro artefatos

1. Pipeline reproduzivel dos CSVs ate observacoes semanais em SQLite.
2. Relatorio gerado de qualidade, cobertura, metodo e limitacoes.
3. Detector robusto que compara medianas e usa desvio absoluto mediano (MAD).
4. API HTTP para resumo e consulta dos pontos detectados.

## Preparacao dos dados

Baixe o dataset [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) e extraia os CSVs em:

```text
services/analytics/data/raw/
```

O MVP requer estes arquivos:

```text
olist_orders_dataset.csv
olist_order_items_dataset.csv
olist_products_dataset.csv
olist_sellers_dataset.csv
olist_order_reviews_dataset.csv
```

Os arquivos brutos e o banco derivado estao ignorados pelo Git.

## Execucao local

```bash
# Na raiz do repositório: cria/reutiliza o .venv e instala os requirements
npm run setup:python

# Depois, no diretório do serviço
cd services/analytics
.venv/Scripts/python -m src.cli run
.venv/Scripts/python main.py
```

No Linux ou macOS, substitua `.venv/Scripts/python` por `.venv/bin/python`.

O pipeline gera:

```text
services/analytics/data/processed/analytics.db
services/analytics/reports/olist-data-quality.md
```

## Execucao com Docker

```bash
docker compose build analytics
docker compose run --rm analytics python -m src.cli run
docker compose up -d analytics
```

## Endpoints

```http
GET /health
GET /analytics/summary
GET /analytics/inflection-points
GET /analytics/inflection-points?severity=HIGH&metric=cancellation_rate
GET /analytics/inflection-points/{id}
```

A documentacao OpenAPI fica em `http://localhost:8000/docs`.

## Unidade de analise

Cada observacao representa:

```text
vendedor + categoria de produto + semana
```

As metricas iniciais sao pedidos, unidades, receita, frete, cancelamento, indisponibilidade, atraso, horas ate aprovacao, horas ate entrega e avaliacao media.

## Metodo de deteccao

Para cada entidade e metrica, o detector:

1. Usa oito semanas anteriores como baseline.
2. Calcula a mediana desse baseline.
3. Compara com a mediana das tres semanas seguintes.
4. Dimensiona a mudanca pelo MAD do baseline.
5. Exige efeito absoluto, efeito relativo quando aplicavel e persistencia.
6. Descarta ativacoes em que o baseline de vendas era zero.
7. Mantem o sinal mais forte por entidade e metrica.

Esse metodo nao exige que os dados sigam distribuicao normal. Os limiares do MVP sao explicitos no codigo e deverao ser calibrados por setor quando empresas reais forem conectadas.

O campo `confidence` e um indice heuristico que combina desvio robusto, tamanho do efeito e quantidade de pedidos observados. Ele serve para ordenar sinais e nao deve ser interpretado como probabilidade estatistica.

## Evolucao para empresas

O adaptador Olist sera substituido ou acompanhado por adaptadores de ERP, planilhas ou APIs. Todos devem produzir o mesmo modelo de observacao. Empresas que fornecam saldo, reserva, compra e inventario fisico permitirao substituir o risco estimado por ruptura confirmada.

Em uma proxima etapa, `Analytics.ObservationCreated` e `Analytics.InflectionPointDetected` poderao ser publicados no Kafka. O processamento batch atual serve para backfill, treinamento e demonstracao reproduzivel.
