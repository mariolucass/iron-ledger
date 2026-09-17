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
- **Mensageria:** RabbitMQ (eventos de domínio) + Kafka (audit log / streaming)
- **Orquestração:** Temporal.io (Sagas e workflows de longa duração)
- **Análise de dados:** Python (serviço isolado, consumidor Kafka)
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
POST /inventory/transactions
        │
        ▼
 InventoryService (DDD)
        │
        ├──► Valida regras de negócio
        ├──► Persiste no PostgreSQL via Prisma
        ├──► Publica DomainEvent no RabbitMQ
        │         │
        │         ├──► AuditConsumer → append-only no PostgreSQL
        │         └──► KafkaRelay → audit log no Kafka
        │
        └──► Inicia Temporal Workflow (Saga)
                  │
                  ├──► Step 1: Reserva de estoque
                  ├──► Step 2: Confirmação externa
                  └──► Compensação automática em falha
```

---

## Pré-requisitos

- Node.js >= 20
- Python >= 3.11
- Docker + Docker Compose
- pnpm

---

## Como rodar

```bash
# PostgreSQL, RabbitMQ, Redis e API (migração e seed são automáticos)
docker compose up -d
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

O worker Temporal, Kafka e frontend permanecem previstos na arquitetura, mas
não fazem parte deste primeiro incremento executável. O laboratório de
analytics abaixo pode ser executado de forma independente.

### Laboratorio de analytics com a Olist

O primeiro incremento experimental do contexto `analytics` usa dados historicos
da Olist para criar observacoes semanais, detectar mudancas persistentes e expor
os resultados por API. O laboratorio e separado do fluxo transacional e nao
trata sinais indiretos como ruptura de estoque confirmada.

Consulte [`docs/analytics/olist-first-step.md`](./docs/analytics/olist-first-step.md)
para baixar os dados, executar o pipeline e consultar os endpoints.

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
