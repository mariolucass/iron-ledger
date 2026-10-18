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
cp apps/api/.env.example apps/api/.env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

O comando `pnpm dev` inicia a API em `http://localhost:3000` e o web em
`http://localhost:3001`. As portas e URLs vêm do `.env` da raiz; na ausência
das variáveis, esses mesmos valores são usados como fallback. Para iniciar só
um app, use `pnpm dev:api` ou `pnpm dev:web`.

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

### Laboratorio de analytics com a Olist

O primeiro incremento experimental do contexto `analytics` usa dados historicos
da Olist para criar observacoes semanais, detectar mudancas persistentes e expor
os resultados por API. O laboratorio e separado do fluxo transacional e nao
trata sinais indiretos como ruptura de estoque confirmada.

Consulte [`docs/analytics/olist-first-step.md`](./docs/analytics/olist-first-step.md)
para baixar os dados, executar o pipeline e consultar os endpoints.

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
