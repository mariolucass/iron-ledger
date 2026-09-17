# Relatorio de qualidade e analise inicial da Olist

Este relatorio e gerado pelo pipeline do servico `analytics`. Os CSVs brutos permanecem fora do Git.

## Cobertura

- Inicio observado: `2016-09-04 21:15:19`
- Fim observado: `2018-10-17 17:30:18`
- Observacoes semanais: **45733**
- Pontos de inflexao detectados: **1360**

## Arquivos importados

| Arquivo | Linhas |
| --- | ---: |
| `olist_order_items_dataset.csv` | 112,650 |
| `olist_order_reviews_dataset.csv` | 99,224 |
| `olist_orders_dataset.csv` | 99,441 |
| `olist_products_dataset.csv` | 32,951 |
| `olist_sellers_dataset.csv` | 3,095 |

## Checagens de qualidade

| Checagem | Ocorrencias |
| --- | ---: |
| `duplicate_orders` | 0 |
| `duplicate_products` | 0 |
| `duplicate_sellers` | 0 |
| `orphan_item_orders` | 0 |
| `orphan_item_products` | 0 |
| `orphan_item_sellers` | 0 |
| `orders_without_purchase_date` | 0 |
| `products_without_category` | 610 |

## Distribuicao dos sinais

| Severidade | Total |
| --- | ---: |
| CRITICAL | 682 |
| HIGH | 474 |
| MEDIUM | 142 |
| LOW | 62 |

## Sinais com maior desvio robusto

| Data | Vendedor | Categoria | Metrica | Severidade | Antes | Depois | Indice heuristico |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| 2017-08-21 | `834f3294fba9f932f56edc879193f925` | cool_stuff | `revenue` | CRITICAL | 572.00 | 2995.00 | 88.0% |
| 2018-04-09 | `d23019c84ffae2d5ef2270367b8605fc` | instrumentos_musicais | `revenue` | CRITICAL | 29.95 | 2118.00 | 81.5% |
| 2017-11-13 | `cc419e0650a3c5ba77189a1882b7556a` | beleza_saude | `orders` | CRITICAL | 17.50 | 54.00 | 95.0% |
| 2018-02-19 | `17a053fcb14bd219540cbde0df490be0` | moveis_escritorio | `delayed_delivery_rate` | CRITICAL | 0.00 | 1.00 | 88.0% |
| 2018-02-19 | `ef0ace09169ac090589d85746e3e036f` | perfumaria | `delayed_delivery_rate` | CRITICAL | 0.00 | 1.00 | 89.0% |
| 2018-02-19 | `ef506c96320abeedfb894c34db06f478` | telefonia | `delayed_delivery_rate` | CRITICAL | 0.00 | 1.00 | 87.0% |
| 2017-11-13 | `1c68394e931a64f90ea236c5ea590300` | informatica_acessorios | `revenue` | CRITICAL | 39.45 | 1977.54 | 90.0% |
| 2018-04-16 | `527801b552d0077ffd170872eb49683b` | livros_interesse_geral | `revenue` | CRITICAL | 19.95 | 1574.70 | 85.5% |
| 2018-05-28 | `2a5b78b41cd05baeac8df54c6606b92c` | beleza_saude | `revenue` | CRITICAL | 24.50 | 1530.00 | 82.5% |
| 2017-11-13 | `05f51e13da97139648b8125c31e5f51b` | bebes | `delayed_delivery_rate` | CRITICAL | 0.00 | 0.86 | 88.5% |

## Metodo

O detector compara a mediana de oito semanas anteriores com a mediana de uma janela persistente de tres semanas. A escala usa o desvio absoluto mediano (MAD), que reduz a dependencia da hipotese de distribuicao normal. Apenas o sinal mais forte por vendedor, categoria e metrica e mantido nesta primeira versao.
Ativacoes apos um baseline sem vendas nao sao classificadas como pontos de inflexao operacionais.

## Limitacoes

- A Olist nao informa saldo, entrada, reserva ou ruptura fisica de estoque.
- `unavailable` e cancelamento sao sinais de risco, nao comprovacao de ruptura.
- Vendedor da Olist nao equivale juridicamente a micro ou pequena empresa.
- Os resultados sao associacoes observacionais e nao demonstram causalidade.
- O indice de confianca combina desvio, efeito e volume observado; ele nao representa probabilidade estatistica.
- Semanas sem venda sao preenchidas com zero somente para metricas aditivas; taxas permanecem ausentes.
- O historico e antigo e deve validar o metodo, nao representar o mercado atual.

## Fonte

Brazilian E-Commerce Public Dataset by Olist: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
