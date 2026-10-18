# Terceira Sprint — Saga ponta a ponta e fundação enterprise

**Projeto:** iron-ledger
**Data de fechamento:** 15 de outubro de 2026
**Branch de trabalho:** `develop` (alterações ainda não commitadas)
**Objetivo da sprint:** transformar a Saga de demonstração em um fluxo de negócio rastreável em todas as camadas
(web → API → Temporal → RabbitMQ → auditoria) e preparar a base técnica — banco, pacotes e configuração do
monorepo — para crescer como um projeto enterprise.

> O registro da segunda sprint foi perdido. A referência anterior a esta sprint é a demonstração da Saga
> validada em 02/10/2026 ([`docs/temporal/saga-demo.md`](../temporal/saga-demo.md)), cujos "limites atuais"
> foram o ponto de partida deste trabalho: não havia tabela de transações, nem tela web conectada, nem outbox.

## Avaliação do escopo

A sprint teve quatro frentes, executadas em sequência:

1. **Modelo de dados** — o schema Prisma foi reorganizado por bounded context (DDD), com um schema PostgreSQL por contexto.
2. **Workflow completo** — a transação orquestrada por Saga passou a existir como agregado de negócio, com rastro, eventos confiáveis e tela.
3. **Plano de arquitetura** — decisões e roteiro para os serviços que ainda não tinham arquitetura definida.
4. **Higiene do monorepo** — `package.json`, `tsconfig.json`, versões e dependências padronizadas.

O resultado principal não é a quantidade de arquivos, e sim o fluxo verificável:

```text
Operador (web) ─► BFF ─► API: Transaction PENDING + outbox ─► Temporal (Saga)
                                   │                               │
                                   ▼                               ▼
                         Outbox relay ─► RabbitMQ ─► Auditoria    Worker: reserva → confirma
                                                                   │   └─ falha → reconcilia → compensa
                                                                   ▼
                                   API: passos + desfecho (COMPLETED | COMPENSATED | FAILED)
                                                                   │
                                          Tela de detalhe acompanha em tempo real ◄┘
```

## Entregas da sprint

### 1. Banco de dados por bounded context (Prisma multi-file)

- Schemas movidos para `apps/api/prisma/schema/`, com uma pasta por contexto: `identity`, `catalog`, `warehouse`,
  `inventory`, `transaction`, `audit`, `analytics` e `platform`.
- `multiSchema`: cada contexto ganha seu próprio schema PostgreSQL, o que permite conceder permissões por
  contexto (o serviço Python acessa só `analytics`).
- O modelo passou de 11 para 48 models e de 4 para 36 enums. Inclui RBAC com escopo por armazém, sessões e MFA,
  lotes, endereçamento físico, transferências, contagens, transações e passos da Saga, auditoria com cadeia
  de hash, alertas, previsões, outbox, inbox e idempotência.
- **Compatibilidade preservada:** nenhum model ou campo usado pelo código foi renomeado ou removido.
- A migration `20261018120000_bounded_context_schemas` **move** as tabelas existentes com `SET SCHEMA`, sem
  DROP e sem perda de dados. O diff ingênuo do Prisma apagaria as 11 tabelas.

### 2. Workflow de transação ponta a ponta

**Pacotes compartilhados** (antes vazios ou só com tipos):

| Pacote | Entrega |
| --- | --- |
| `@iron-ledger/shared-types` | Envelope de evento padronizado (`eventVersion`, `producer`, `correlationId`, `causationId`), eventos de inventário e transação, DTOs de transação |
| `@iron-ledger/logger` | Logs JSON (pino) com correlationId automático via `AsyncLocalStorage` e redação de credenciais |
| `@iron-ledger/event-bus` | RabbitMQ com publisher confirms, retry com contador, fila `<queue>.dead-letter`, implementação em memória |
| `@iron-ledger/workflow-contracts` | Contratos worker↔API: progresso de passo e desfecho da Saga |

**API (`apps/api`):**

- Contexto `transaction` completo: agregado com máquina de estados, casos de uso (iniciar, consultar,
  registrar passo, reportar desfecho), repositório Prisma com read model e ACL de saldo sobre o inventário.
- **Outbox transacional**: o evento é gravado no mesmo commit do estado. Um relay publica no RabbitMQ usando
  `FOR UPDATE SKIP LOCKED` (seguro com várias instâncias), backoff e `DEAD_LETTER`.
- `Idempotency-Key` em `POST /transactions` (repetir o pedido devolve a mesma transação).
- Middleware de correlação e log de requisições; guard RBAC (`requireRoles`).
- Endpoints: `GET/POST /transactions`, `GET /transactions/:id`, `POST /transactions/:id/steps` e
  `POST /transactions/:id/outcome` (internos, para o worker).

**Worker (`apps/temporal-worker`):**

- Saga rastreada sob o patch `transaction-saga-lifecycle-v2`. Cada passo é registrado na API como RUNNING e
  depois SUCCEEDED ou FAILED, e o desfecho final é reportado.
- Histórias antigas (sem patch e com o patch v1) continuam reproduzíveis, com teste de replay.
- Logs do SDK do Temporal redirecionados para o logger JSON; desligamento gracioso.

**Web (`apps/web`):**

- A tela de transações deixou de usar dados fictícios: tem filtros por status e período, paginação e
  atualização automática enquanto houver Sagas em andamento.
- A tela de detalhe mostra itens, linha do tempo real dos passos, compensação e histórico de estados.
- Nova feature `start-transaction` ("Nova transação", com a opção "simular falha" para demonstrar a compensação).

### 3. Plano de arquitetura

[`docs/architecture/enterprise-architecture-plan.md`](../architecture/enterprise-architecture-plan.md)
reúne a arquitetura recomendada por serviço (monólito modular na API, worker hexagonal, FSD + BFF no web,
analytics isolado por eventos), as pendências de cada contexto, um roteiro em seis fases e seis ADRs a registrar.

### 4. Organização de `package.json` e `tsconfig.json`

- **Catálogo central de versões** (`pnpm-workspace.yaml`, `"catalog:"`). O SDK do Temporal fica na mesma
  versão exata em todos os pacotes (antes misturava `^1.8.0` e `1.24.0`).
- **Node 24 LTS** em `engines`, `mise.toml`, Dockerfiles e `bootstrap.mjs`. O Node 20 está fora de suporte
  desde abril de 2026.
- Removidos: o workspace pnpm aninhado dentro de `apps/web` (lockfile e `packageManager` próprios), 44
  componentes shadcn sem uso e cerca de 30 dependências que existiam só para eles, além de `ts-node-dev`
  (sem manutenção), `pino` e `amqplib` na API (que deixou de importá-los diretamente), e o script `lint`, que
  não executava nada.
- Adicionados: `server-only` (importado, mas não declarado), `prettier` com scripts `format`, script `test` no
  web e `typecheck` que funciona sem `.next/`.
- tsconfig base único (NodeNext, ES2023, `noUncheckedIndexedAccess`), com `tsconfig.build.json` separado
  para que o `dist/` não inclua testes. A configuração mais estrita revelou três acessos inseguros, que foram
  corrigidos.

## Alterações já presentes no `git status` (anteriores a esta sessão)

O `git status` acumula trabalho não commitado de antes desta sprint. Ele faz parte do pacote a ser
commitado e deve ser revisado junto:

- **Web — migração para Feature-Sliced Design:** `src/features/(grupo)/*` (63 arquivos) foi substituído por
  `src/views/`, `src/entities/`, `src/features/{sign-in,sign-out,record-stock-movement}` e `src/shared/api/client.ts`,
  com rotas BFF de commit de reserva e transações e testes em `apps/web/tests/`.
- **Worker — refatoração hexagonal:** `src/activities/*` e `src/workflows/*` foram substituídos por
  `bootstrap/`, `infrastructure/`, `modules/transaction/`, `ports/` e testes de replay.
- **API — inventário:** endpoints `POST /inventory/reservations/:id/commit` e
  `GET /inventory/reservations/by-transaction/:transactionId`, além do teste do repositório Prisma.
- **Infra e docs:** ajustes em `docker-compose.yml` e `.env.example`; `primeira-sprint.md` e
  `plano-video-pnpm-dev.md` movidos de `docs/` para `docs/sprints/`; `frontend-fsd-proposal.md`.
- **Arquivos órfãos:** `packages/*/.prettierrc` repetem o `.prettierrc` da raiz e podem ser removidos.

Números atuais: 143 arquivos rastreados alterados (+2.306 / −16.715 linhas, a maior parte das remoções vem do
kit shadcn e da migração do web) e 63 caminhos novos.

## Evidências de validação

| Verificação | Resultado |
| --- | --- |
| `pnpm typecheck` (7 workspaces) | ✔ |
| Testes `logger` / `event-bus` | 2/2 · 4/4 |
| Testes da API (vitest) | 28/28 (15 novos no contexto `transaction`) |
| Testes unitários do worker | 22/22 |
| Integração Temporal (time-skipping, incluindo replay v0/v1/v2) | 9/9, antes da reorganização dos tsconfigs |
| Testes do web | 15/15 |
| `pnpm build` (pacotes, API, worker, `next build`) | ✔ |
| `pnpm install --frozen-lockfile` | ✔ |
| `prisma validate` / `prisma generate` | ✔ |

## Limitações assumidas

- **Não validado em infraestrutura real:** a migration, o outbox e a Saga não rodaram contra PostgreSQL,
  RabbitMQ e Temporal reais, porque o ambiente de desenvolvimento usado não tinha Docker. Os Dockerfiles
  também não foram construídos.
- Os testes de integração do Temporal não foram executados de novo depois da reorganização dos tsconfigs.
- O inventário ainda publica eventos **depois** do commit, sem passar pelo outbox.
- O worker se autentica com o usuário admin do seed. Os endpoints internos aceitam o papel SERVICE ou ADMIN.
- Uma Saga cujo desfecho não puder ser reportado fica em `PROCESSING` até haver uma reconciliação, que ainda
  não existe.
- Restrições que o Prisma não expressa (CHECKs, `NULLS NOT DISTINCT`, trigger append-only, particionamento)
  estão documentadas, mas não aplicadas.
- Multi-tenancy foi deixado de fora de propósito; a decisão afeta as chaves únicas.

## Como demonstrar

```bash
pnpm infra:core && docker compose --profile platform up -d temporal temporal-ui
pnpm db:generate && pnpm db:deploy && pnpm db:seed
pnpm dev            # API + web
pnpm dev:worker     # outro terminal
```

1. Em `/transactions`, clicar em **Nova transação** e iniciar uma Saga de 1 unidade.
2. Mostrar a linha do tempo passando de reservar a confirmar e o status `Concluída`.
3. Repetir marcando **Simular falha na confirmação**: confirmar falha, reconciliar, liberar reserva, `Compensada`.
4. Abrir a Temporal UI (`:8088`) e mostrar o mesmo workflow pelo ID da transação.
5. Em `/audit-log`, mostrar os eventos `Transaction.*` e `Inventory.*` com o mesmo correlationId.
6. Opcional: mostrar `platform.outbox_events` com os eventos `PUBLISHED`.

## Sugestão para o Git

### Branch

```text
feat/sprint-3-saga-ponta-a-ponta
```

Alternativas: `feat/transaction-saga-e2e`, `chore/sprint-3-enterprise-foundation`.

### Commits (recomendado: separar por assunto, em Conventional Commits)

```text
feat(db): reorganiza schema Prisma por bounded context com multiSchema
feat(packages): implementa shared-types, logger e event-bus compartilhados
feat(api): contexto de transação com outbox transacional e idempotência
feat(worker): saga rastreada com patch lifecycle-v2 e testes de replay
feat(web): telas de transação conectadas à API e feature start-transaction
refactor(web): migra telas para Feature-Sliced Design (views/entities)
chore(monorepo): padroniza package.json, tsconfig e Node 24 com catálogo pnpm
docs: plano de arquitetura enterprise e registros das sprints 3 e 4
```

### Commit único (se preferir)

```text
feat: saga de transação ponta a ponta e fundação enterprise do monorepo

- schema Prisma por bounded context (multiSchema) com migration sem perda de dados
- pacotes shared-types, logger e event-bus; contratos worker↔API
- contexto transaction na API com outbox transacional, idempotência e RBAC
- saga rastreada no worker (patch lifecycle-v2) com replay das versões anteriores
- telas de transações conectadas à API e feature "Nova transação"
- migração do web para FSD e refatoração hexagonal do worker
- package.json/tsconfig padronizados, catálogo pnpm, Node 24 LTS
- plano de arquitetura e documentação das sprints
```
