# iron-ledger

> Sistema distribuído de auditoria, controle de estoque e orquestração de transações com arquitetura orientada a eventos e Domain-Driven Design.

---

## Visão Geral

O **iron-ledger** é uma plataforma backend-first para ambientes que exigem rastreabilidade completa, consistência transacional e controle de inventário em tempo real. O sistema é construído sobre princípios de DDD, event-driven architecture e orquestração de workflows de longa duração via Temporal.io.

```
Mutação de Estoque → Evento de Domínio → Auditoria Imutável → Análise de Dados
       ↓
  Temporal Workflow (Saga) → Compensação em caso de falha
```

---

## Domínios (Bounded Contexts)

| Contexto      | Responsabilidade                                  |
| ------------- | ------------------------------------------------- |
| `inventory`   | Controle de estoque, movimentações, reservas      |
| `audit`       | Registro imutável de todas as mutações do sistema |
| `transaction` | Orquestração de transações distribuídas (Sagas)   |
| `analytics`   | Análise de dados, relatórios e alertas (Python)   |
| `identity`    | Autenticação, autorização e RBAC                  |

---

## Stack

### Backend

- **Runtime:** Node.js + TypeScript
- **Arquitetura:** Domain-Driven Design + Event-Driven Architecture
- **ORM:** Prisma
- **Banco de dados:** PostgreSQL
- **Cache:** Redis
- **Mensageria:** RabbitMQ (eventos de domínio e auditoria); Kafka disponível como infraestrutura opcional, sem relay operacional neste fluxo
- **Orquestração:** Temporal.io (Sagas e workflows de longa duração)
- **Análise de dados:** Python (serviço isolado; pipeline batch da Olist e API HTTP)
- **Infraestrutura:** Docker + Docker Compose

### Frontend

- **Framework:** Next.js 14+ (App Router, SSR)
- **Arquitetura:** Feature-Sliced Design (FSD)
- **UI:** shadcn/ui + Tailwind CSS
- **Estado global:** Zustand
- **Estado de URL:** nuqs
- **Data fetching:** TanStack Query
- **Linguagem:** TypeScript

---

## Decisões Arquiteturais

As decisões técnicas relevantes estão documentadas como ADRs em [`docs/adr/`](./docs/adr/).

| ADR                                                       | Decisão                                               |
| --------------------------------------------------------- | ----------------------------------------------------- |
| [ADR-001](./docs/adr/adr-001-temporal-vs-bullmq.md)       | Temporal.io vs BullMQ para orquestração               |
| [ADR-002](./docs/adr/adr-002-kafka-rabbitmq-split.md)     | Separação de responsabilidades entre Kafka e RabbitMQ |
| [ADR-003](./docs/adr/adr-003-audit-append-only.md)        | Tabelas de auditoria como append-only imutável        |
| [ADR-004](./docs/adr/adr-004-python-analytics-service.md) | Serviço Python isolado via mensageria                 |

---

## Fluxo Principal

```
POST /inventory/movements
        └──► Saldo + movimento no PostgreSQL
                 └──► RabbitMQ → consumidor de auditoria → audit_logs

POST /transactions
        └──► Temporal Workflow
                 ├──► Reserva de estoque pela API
                 ├──► Confirma: baixa de estoque + movimento
                 └──► Falha: libera a reserva (compensação)
```

---

## Pré-requisitos

- Node.js >= 24 (LTS; `mise install` usa a versão do `mise.toml`)
- Python >= 3.11
- Docker + Docker Compose
- pnpm

---

## Como rodar

### Preparação local automatizada

Na raiz do repositório, execute o instalador modular interativo:

```bash
npm run setup
```

Ele instala todo o workspace pnpm na ordem de prioridade dos módulos e, em
seguida, oferece a criação ou reutilização de
`services/analytics/.venv` com as dependências Python. Não é necessário instalar
o pnpm globalmente: quando ele não estiver disponível, o script usa a versão
declarada no projeto por meio do npm.

Para instalar tudo sem perguntas, ou somente uma das partes:

```bash
npm run setup:all
npm run setup:node
npm run setup:python
```

O instalador exige Node.js 24+ e, quando o analytics for selecionado, Python
3.11+.

```bash
# Crie o arquivo apenas se ele ainda não existir e ajuste suas conexões.
cp .env.example .env
# PostgreSQL, RabbitMQ, Redis e API (migração e seed são automáticos)
docker compose up -d --build
```

A API fica em `http://localhost:3000`, e o painel do RabbitMQ em
`http://localhost:15672` (`iron_ledger` / `iron_ledger`). O Compose cria um
usuário local para testes (`admin@ironledger.local` / `ChangeMe123!`). Troque
esses segredos fora do ambiente local.

Para executar a API fora do Docker:

```bash
pnpm install
# Se ainda não existir, copie .env.example para .env na raiz e ajuste as URLs.
# Suba PostgreSQL e RabbitMQ, ou use serviços locais já existentes.
# Com os serviços deste projeto: pnpm infra:core
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

O comando `pnpm dev` inicia a API em `http://localhost:3000`, o web em
`http://localhost:3001`, o worker Temporal e o analytics em `http://localhost:8000`.
Antes de iniciar, ele verifica as dependências: o worker é pulado se o Temporal
não responder (`pnpm infra:platform`) e o analytics se faltar o `.venv`
(`pnpm setup:python`) ou se a porta estiver ocupada. A queda de um serviço não
derruba os demais. Para iniciar só um app, use `pnpm dev:api`, `pnpm dev:web`,
`pnpm dev:worker` ou `pnpm dev:analytics`.

`pnpm setup:all` prepara tudo de uma vez: cria o `.env` a partir do
`.env.example` se ele não existir, instala o workspace Node.js, gera o Prisma
Client, cria o `.venv` dos serviços Python e baixa os dados da Olist e executa o
pipeline do analytics.

### Configuração do ambiente

O **`.env` da raiz é o arquivo principal**. Ele concentra conexões, portas,
autenticação, conta inicial e configuração dos serviços opcionais. Os arquivos
`.env.example` são modelos, não são carregados pela aplicação.

| Arquivo | Responsabilidade |
| --- | --- |
| `.env` | Base compartilhada dos comandos locais e variáveis do Docker Compose. |
| `apps/api/.env` | Sobrescritas opcionais usadas apenas pela API, Prisma e seed. |
| `apps/web/.env`, `apps/temporal-worker/.env`, `services/analytics/.env` | Sobrescritas opcionais do app correspondente nos comandos `pnpm dev:*`. |

A prioridade é **terminal/hosting → `.env` do app → `.env` da raiz → padrão do código**.
Normalmente, mantenha apenas o arquivo da raiz. O modelo `apps/api/.env.example`
contém somente exemplos comentados; copiá-lo não troca suas credenciais.

- **API e banco:** `pnpm db:*`, os scripts `prisma:*` em `apps/api`, o seed e a API
  usam o mesmo carregador. Use `pnpm db:status` para verificar migrações sem alterar
  o banco. Use `pnpm db:dev` para executar `prisma migrate dev` ou
  `pnpm db:dev --name exemplo` para nomear uma migração.
  Invocar `prisma` diretamente ignora o carregador do projeto; prefira esses scripts.
- **Portas:** defina `API_PORT` e `WEB_PORT` na raiz. `API_URL` e
  `NEXT_PUBLIC_APP_URL` são opcionais: os comandos locais as derivam das portas
  quando ausentes. `PORT` é uma sobrescrita do runtime/hosting; não a defina na raiz.
- **Docker:** lê o `.env` da raiz para preencher as variáveis declaradas no Compose;
  não lê os `.env` dos apps. `POSTGRES_*` e `RABBITMQ_*` provisionam os containers;
  `DATABASE_URL` e `RABBITMQ_URL` conectam os processos do host. Ajuste os dois grupos
  quando mudar credenciais. Os containers usam nomes internos de host. Credenciais
  de volumes existentes não mudam só por editar o `.env`.
- **Login:** `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` definem a conta do seed.
  Editar o arquivo não muda a conta existente. `pnpm db:seed` atualiza a conta e
  repõe a massa de demonstração; não é apenas uma redefinição de senha.
  O worker usa essa mesma conta, salvo configuração de `WORKER_SERVICE_*`.
- **Valores:** use valores literais, sem `${OUTRA_VARIAVEL}`; o carregador não faz
  interpolação. Em URLs, aplique URL-encode aos caracteres especiais das credenciais.
  Nunca coloque segredos em variáveis `NEXT_PUBLIC_*`.

Depois de alterar o ambiente, reinicie os processos. As credenciais dos exemplos
são locais; mantenha os valores reais apenas nos `.env` ignorados pelo Git.

### Autenticação e evento de teste

```bash
# Obtenha o accessToken
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ironledger.local","password":"ChangeMe123!"}'

# Publique no exchange iron-ledger.domain usando o token retornado
curl -X POST http://localhost:3000/events/test \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventName":"Inventory.StockUpdated","payload":{"sku":"SKU-001","quantity":10}}'
```

O frontend de estoque e auditoria acessa a API pelo BFF do Next.js. Uma Saga de
reserva, confirmação e compensação pode ser iniciada por `POST /transactions`,
com o worker iniciado separadamente por `pnpm dev:worker`. Temporal Server e UI
são infraestrutura opcional no perfil `platform`. Consulte
[`docs/temporal/saga-demo.md`](./docs/temporal/saga-demo.md) para executar o fluxo.

### Inventário e auditoria

As rotas operacionais exigem o JWT retornado por `POST /auth/login`:

```text
GET  /inventory
GET  /inventory?sku=SKU-4821&warehouseId=<uuid>&page=1&pageSize=20
GET  /warehouses
GET  /inventory/:stockLevelId/movements
POST /inventory/movements
POST /inventory/reservations
POST /inventory/reservations/:id/release
GET  /audit?eventName=&entityType=&entityId=&actor=&from=&to=&page=&pageSize=
```

Exemplo de movimentação:

```bash
curl -X POST http://localhost:3000/inventory/movements \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: demo-movimento-01" \
  -d '{"stockLevelId":"UUID_DO_SALDO","type":"OUTBOUND","quantity":1,"referenceId":"DEMO-001"}'
```

A atualização do saldo e o registro da movimentação são atômicos. Depois do
commit, a API publica um evento no RabbitMQ; o consumidor de auditoria persiste
o evento de forma idempotente e append-only. O frontend acessa essas rotas pelo
BFF do Next.js e mantém os dados mockados somente como fallback de leitura.

### Analytics: o que mudou de patamar

**Para que serve.** Inventário e auditoria registram *o que aconteceu* (cada
movimento, cada reserva). O analytics responde *o que mudou*: quais vendedores e
categorias saíram do comportamento habitual e não voltaram. É a camada que
transforma o histórico em alertas acionáveis:

| Sinal detectado | Por que importa para o estoque |
| --- | --- |
| Pedidos ou unidades caem e ficam baixos | Possível ruptura, anúncio pausado ou preço fora do mercado |
| Pedidos sobem e se mantêm | O ponto de reposição e o estoque de segurança ficaram pequenos |
| Taxa de indisponibilidade ou cancelamento sobe | Venda sem saldo real; inventário físico diverge do sistema |
| Atraso e prazo de entrega sobem | Gargalo de expedição; costuma anteceder queda na avaliação |
| Avaliação média cai | Efeito no cliente; cruze com atraso e cancelamento do período |

**Como funciona.** O pipeline agrupa os pedidos em observações
`vendedor + categoria + semana`. Para cada métrica, compara a mediana das 8
semanas anteriores com a das 3 seguintes e só gera um *ponto de inflexão* quando
a mudança é grande, foge da oscilação normal daquele vendedor (mediana e MAD) e
persiste. Picos isolados não viram alerta.

**Por que a Olist.** O Iron Ledger ainda não tem histórico operacional
suficiente. O dataset público da Olist (~100 mil pedidos reais, 2016–2018) serve
de laboratório para validar o método com dados reais. O modelo de observação é
independente da fonte: o próximo passo é alimentá-lo com os movimentos de
`inventory` e as transações das Sagas, e publicar
`Analytics.InflectionPointDetected` para virar alerta no painel.

**Limites.** Os sinais mostram *quando* algo mudou, não *por quê*. A Olist não
tem saldo de estoque, então nenhuma ruptura é confirmada aqui. `confidence` é um
índice para ordenar sinais, não uma probabilidade.

**Onde ver.** No web, `/analytics` mostra o resumo, os sinais por métrica
(melhorou × piorou) e a lista filtrável; `/analytics/inflection-points/:id`
mostra a série semanal, os valores usados no cálculo e o que verificar.

| Endpoint (`http://localhost:8000`) | Retorna |
| --- | --- |
| `GET /analytics/summary` | Totais, período observado, contagem por severidade, tipo, impacto e métrica |
| `GET /analytics/metrics` | Catálogo das métricas: descrição, unidade, se maior é melhor, o que verificar |
| `GET /analytics/inflection-points` | Lista paginada com `total`; filtros `seller_id`, `metric`, `severity`, `classification`, `impact` |
| `GET /analytics/inflection-points/:id` | Ponto com rótulos legíveis, UF do vendedor e `series` semana a semana |

**Precisão da previsão de demanda.** Em `/forecasting`, cada produto recebe uma
previsão semanal (média das 4 semanas anteriores) que é reavaliada semana a
semana contra a venda real nas últimas 12 semanas completas (backtest). A
acurácia é `1 − WAPE`, o viés mostra se o modelo superestima ou subestima e a
cobertura indica quantas semanas caíram dentro do intervalo de 95%. É uma
linha de base: mede o quanto um modelo simples acertaria, não substitui um
modelo sazonal.

| Endpoint (`http://localhost:8000`) | Retorna |
| --- | --- |
| `GET /analytics/forecast-accuracy` | Acurácia, WAPE, viés e cobertura por produto (`category`, `search`, `limit`), mais o resumo geral |
| `GET /analytics/forecast-accuracy/:productId` | Métricas do produto e série semanal previsto × real com intervalo |

Cada ponto traz, além dos valores brutos, `metric_label`, `unit`,
`direction` (`UP`/`DOWN`), `impact` (`POSITIVE`/`NEGATIVE`, já considerando se
subir é bom ou ruim para aquela métrica) e `what_to_check`.

Para baixar os dados, executar o pipeline e detalhes do método, consulte
[`docs/analytics/olist-first-step.md`](./docs/analytics/olist-first-step.md).

### Perfis opcionais de infraestrutura

Os componentes mais pesados ficam em perfis para manter o ambiente padrão
leve. Eles podem ser combinados conforme a necessidade:

```bash
# Kafka, Temporal Server e Temporal UI
pnpm infra:platform

# API de analytics
pnpm infra:analytics

# Jaeger com receptores OTLP
docker compose --profile observability up -d

# Toda a infraestrutura disponível
docker compose --profile platform --profile analytics --profile observability up -d --build
```

Serviços locais: API em `http://localhost:3000`, analytics em
`http://localhost:8000`, Temporal UI em `http://localhost:8088`, Jaeger em
`http://localhost:16686` e RabbitMQ Management em `http://localhost:15672`.
Copie `.env.example` para `.env` para personalizar portas e credenciais.

O worker Temporal pode rodar localmente com `pnpm dev:worker` ou pelo perfil
`worker` do Compose. O frontend roda localmente com `pnpm dev` e não entra no
Compose padrão.

Para validar uma imagem semelhante a produção, sem hot reload nem bind mounts:

```bash
docker compose -f docker-compose.yml -f infra/compose/docker-compose.prod.yml up -d --build
```

Use credenciais fortes no `.env` antes de executar esse override fora da sua
máquina. O override `infra/compose/docker-compose.dev.yml` explicita os mounts
usados durante o desenvolvimento.

---

## Estrutura do Projeto

```
iron-ledger/
├── apps/
│   ├── api/               # Backend principal (Node.js + DDD)
│   ├── web/               # Frontend (Next.js + FSD)
│   └── temporal-worker/   # Worker de workflows Temporal
├── services/
│   └── analytics/         # Serviço Python de análise de dados
├── packages/
│   ├── shared-types/      # Tipos e contratos compartilhados
│   ├── event-bus/         # Abstração do EventBus (RabbitMQ)
│   └── logger/            # Logger centralizado (OpenTelemetry)
├── infra/
│   ├── docker/            # Dockerfiles por serviço
│   └── compose/           # Docker Compose por ambiente
└── docs/
    ├── adr/               # Architecture Decision Records
    ├── architecture/      # Diagramas e visão geral
    └── flows/             # Fluxos de domínio documentados
```

> Estrutura completa em [`docs/architecture/directory-structure.md`](./docs/architecture/directory-structure.md)

---

## Observabilidade

- **Tracing distribuído:** OpenTelemetry + Jaeger
- **Logs:** estruturados em JSON via logger centralizado
- **Temporal UI:** dashboard de workflows em `http://localhost:8088`

---

## Licença

MIT
