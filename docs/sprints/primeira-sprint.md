# Primeira Sprint — Fundação Executável e Laboratório Analítico

**Projeto:** iron-ledger
**Data da apresentação:** 17 de setembro de 2026
**Objetivo da sprint:** transformar a proposta arquitetural em uma primeira fatia executável e validar a viabilidade do contexto de análise de dados com uma base pública real.

## Avaliação do escopo

A primeira sprint entregou mais componentes do que normalmente seria necessário para apenas iniciar o projeto. O escopo, porém, permanece coerente quando apresentado como uma **sprint de fundação e prova de conceito**, não como produto final.

O principal resultado não é a quantidade de arquivos. É a existência de um fluxo verificável:

```text
Dados reais da Olist
        ↓
Validação e transformação
        ↓
Observações semanais
        ↓
Detecção de mudanças persistentes
        ↓
Relatório e API consultável
```

Em paralelo, o backend possui uma base executável para autenticação, persistência e publicação de eventos.

## Problema investigado

Pequenas e médias empresas podem apresentar mudanças importantes de comportamento antes que um problema operacional se torne evidente. Exemplos incluem aumento persistente de cancelamentos, crescimento de atrasos, queda de avaliações ou alteração abrupta da demanda.

A hipótese inicial é:

> Dados históricos podem ser transformados em observações comparáveis e usados para identificar mudanças persistentes, com evidências e limitações explícitas, antes da conexão com dados privados de empresas.

A Olist foi escolhida como base de treinamento porque contém dados reais e anonimizados de pedidos, itens, produtos, vendedores, entregas e avaliações.

## Entregas da sprint

### 1. Fundação executável do backend

- Monorepo organizado em aplicações, serviços e pacotes compartilhados.
- API Node.js e TypeScript.
- PostgreSQL com Prisma e migração inicial.
- Seed idempotente de usuário administrador.
- Login com senha protegida por hash e emissão de JWT.
- Proteção de rota por autenticação.
- Publicação de evento de teste em um exchange durável do RabbitMQ.
- PostgreSQL, RabbitMQ, Redis e API orquestrados com Docker Compose.
- Healthchecks e encerramento controlado das conexões.

### 2. Pipeline reproduzível da Olist

O serviço Python valida e importa cinco fontes necessárias para o experimento:

- Pedidos.
- Itens dos pedidos.
- Produtos.
- Vendedores.
- Avaliações.

Os dados são transformados na unidade analítica:

```text
vendedor + categoria de produto + semana
```

As observações contêm pedidos, unidades, receita, frete, cancelamento, indisponibilidade, atraso, tempo de aprovação, tempo de entrega e avaliação média.

Os CSVs originais permanecem imutáveis e fora do Git. O pipeline armazena os dados derivados em SQLite para permitir execução local simples e reproduzível.

### 3. Relatório de qualidade e limitações

O relatório é gerado automaticamente após o processamento. Ele registra:

- Quantidade de linhas por fonte.
- Período coberto pela base.
- Duplicidades de identificadores.
- Relacionamentos órfãos.
- Produtos sem categoria.
- Quantidade e distribuição dos sinais encontrados.
- Método utilizado.
- Limitações da interpretação.

### 4. Detector de pontos de inflexão

O detector compara:

- Mediana das oito semanas anteriores.
- Mediana de uma janela persistente de três semanas.
- Tamanho absoluto e relativo da mudança.
- Desvio absoluto mediano, ou MAD.
- Quantidade de pedidos que sustenta o sinal.

O uso de mediana e MAD reduz a dependência da hipótese de distribuição normal. Ativações após um histórico sem vendas são descartadas para evitar classificá-las como mudanças operacionais.

O resultado inclui severidade, índice heurístico, explicação e os valores usados na análise. O índice serve para ordenar sinais e não representa probabilidade estatística.

### 5. API de consulta

O serviço analítico expõe:

```http
GET /health
GET /analytics/summary
GET /analytics/inflection-points
GET /analytics/inflection-points?severity=HIGH&metric=cancellation_rate
GET /analytics/inflection-points/{id}
```

A documentação interativa fica disponível em `http://localhost:8000/docs`.

### 6. Contratos compartilhados

Foram definidos contratos TypeScript para os futuros eventos:

- `Analytics.ObservationCreated`.
- `Analytics.InflectionPointDetected`.

Esses contratos preparam a evolução do processamento batch atual para integração com Kafka e dados operacionais de empresas.

## Resultados obtidos com a base real

| Indicador | Resultado |
| --- | ---: |
| Pedidos importados | 99.441 |
| Itens importados | 112.650 |
| Produtos importados | 32.951 |
| Vendedores importados | 3.095 |
| Avaliações importadas | 99.224 |
| Observações semanais geradas | 45.733 |
| Sinais persistentes detectados | 1.360 |
| Pedidos duplicados | 0 |
| Itens sem pedido relacionado | 0 |
| Itens sem produto relacionado | 0 |
| Itens sem vendedor relacionado | 0 |
| Produtos sem categoria | 610 |

Os 1.360 sinais são candidatos para investigação. Eles não representam automaticamente 1.360 problemas reais ou rupturas de estoque.

## O que pode ser demonstrado ao professor

### Demonstração do backend

```bash
docker compose up -d
```

1. Abrir `http://localhost:3000/health`.
2. Fazer login com o usuário local.
3. Publicar um evento autenticado.
4. Mostrar o evento chegando ao RabbitMQ.

### Demonstração analítica

```bash
cd services/analytics
python -m src.cli run
python main.py
```

1. Mostrar o resumo em `http://localhost:8000/analytics/summary`.
2. Abrir `http://localhost:8000/docs`.
3. Filtrar pontos por severidade ou métrica.
4. Abrir uma detecção individual e mostrar baseline, janela atual e limitação.
5. Apresentar o relatório gerado em `services/analytics/reports/olist-data-quality.md`.

Se o tempo da apresentação for curto, a demonstração analítica deve ser priorizada porque representa a hipótese específica investigada nesta sprint.

## Evidências de validação

- Teste ponta a ponta do pipeline aprovado.
- Pipeline executado sobre a base real completa da Olist.
- API validada nos endpoints de saúde, resumo e consulta filtrada.
- Contratos TypeScript compilados em modo estrito.
- Configuração do Docker Compose validada.
- Dados brutos e banco derivado protegidos contra inclusão acidental no Git.

## Limitações assumidas

- A Olist não possui saldo, entrada, reserva ou inventário físico.
- Cancelamento e status `unavailable` indicam risco, não ruptura confirmada.
- Um vendedor da Olist não pode ser classificado juridicamente como pequena ou média empresa apenas por seu volume na base.
- Os resultados mostram associação temporal, não causalidade.
- Os limiares ainda não foram calibrados para um setor ou empresa específica.
- O histórico da Olist serve para validar o método e não representa o mercado atual.
- O processamento ainda é batch e local.

Essas limitações fazem parte do resultado científico da sprint e evitam conclusões maiores do que os dados permitem.

## Fora do escopo desta sprint

- Integração do analytics com Kafka em tempo real.
- Confirmação de ruptura por saldo real de estoque.
- Treinamento de modelo preditivo supervisionado.
- Explicação por modelo de linguagem.
- Implementação completa das Sagas no Temporal.
- Dashboard web de indicadores.
- Calibração dos sinais com uma empresa parceira.

## Próxima sprint sugerida

1. Classificar separadamente ativação, crescimento, queda e possível interrupção operacional.
2. Criar agregação por vendedor, além de vendedor e categoria.
3. Avaliar precisão dos sinais com amostragem manual rotulada.
4. Introduzir métricas de suporte mínimo e calibração por segmento.
5. Publicar `Analytics.InflectionPointDetected` no Kafka.
6. Criar uma visualização simples da série temporal e do ponto detectado.
7. Definir o contrato de entrada para dados de uma empresa real.

