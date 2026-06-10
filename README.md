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
# Clone o repositório
git clone https://github.com/seu-usuario/iron-ledger.git
cd iron-ledger

# Suba a infraestrutura
docker compose up -d

# Instale dependências do backend
cd apps/api && pnpm install

# Rode as migrations
pnpm prisma migrate dev

# Inicie o servidor
pnpm dev

# Em outro terminal, inicie o worker Temporal
cd apps/temporal-worker && pnpm dev

# Serviço Python de analytics
cd services/analytics
pip install -r requirements.txt
python main.py
```

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
