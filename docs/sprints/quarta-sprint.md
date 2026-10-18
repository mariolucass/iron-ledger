# Quarta Sprint — Planejamento: validação real, confiabilidade e observabilidade

**Projeto:** iron-ledger
**Período sugerido:** 15 a 29 de outubro de 2026 (duas semanas, a partir do fechamento da terceira sprint)
**Base:** [`terceira-sprint.md`](./terceira-sprint.md) e fases 0–2 do
[`plano de arquitetura`](../architecture/enterprise-architecture-plan.md#5-roteiro-sugerido)

## Objetivo

Provar em infraestrutura real o fluxo entregue na terceira sprint e fechar as lacunas de confiabilidade que
ainda impedem chamá-lo de pronto: inventário fora do outbox, identidade do worker, Sagas órfãs e falta de
rastreio ponta a ponta.

> **Meta da sprint:** uma transação iniciada no web pode ser acompanhada por um único `traceId` da tela até a
> auditoria, sobrevive à queda de qualquer componente sem perder eventos e roda em CI a cada push.

## Backlog priorizado

### P0 — Validar o que foi entregue (primeiros dias)

| # | Item | Critério de aceite |
| --- | --- | --- |
| 1 | Commitar a terceira sprint em `feat/sprint-3-saga-ponta-a-ponta` e abrir PR para `develop` | PR revisado e mergeado; commits separados por assunto |
| 2 | Aplicar a migration `20261018120000_bounded_context_schemas` em um banco com dados do seed | Tabelas nos schemas novos, contagens iguais antes e depois, `prisma migrate status` limpo |
| 3 | Executar a Saga real (sucesso e compensação) com Docker | Status final correto, saldo coerente, eventos `PUBLISHED` no outbox e registros em `audit_logs` |
| 4 | Construir as imagens Docker (Node 24) e subir com `pnpm prod:up` | API, worker e web respondem; healthchecks verdes |
| 5 | Rodar `pnpm test:temporal` de novo após a reorganização dos tsconfigs | 9/9 |

### P1 — Confiabilidade

| # | Item | Critério de aceite |
| --- | --- | --- |
| 6 | Migrar os casos de uso do inventário (`UpdateStock`, `Reserve`, `Release`, `Commit`) para o outbox | Evento gravado na mesma transação do saldo; nenhum `publish` direto restante na API |
| 7 | Reconciliação de Sagas órfãs | Job (Temporal Schedule) que compara `PROCESSING`/`COMPENSATING` com o estado no Temporal e finaliza ou alerta |
| 8 | Inbox nos consumidores (`platform.inbox_messages`) | Consumidor de auditoria deduplica por `(consumer, messageId)` |
| 9 | Restrições no banco | CHECK `reserved <= quantity`, trigger que bloqueia UPDATE/DELETE em `audit.audit_logs`, `UNIQUE NULLS NOT DISTINCT` onde está documentado |

### P1 — Segurança e identidade

| # | Item | Critério de aceite |
| --- | --- | --- |
| 10 | Identidade de serviço para o worker | Papel `SERVICE` no seed e um usuário (ou API key) dedicado; o worker deixa de usar o admin |
| 11 | RBAC por permissão | `requireRoles` evolui para permissões de `identity.permissions` em pelo menos `transaction` e `inventory` |

### P2 — Observabilidade

| # | Item | Critério de aceite |
| --- | --- | --- |
| 12 | Pacote `@iron-ledger/telemetry` (OpenTelemetry) | Traces de HTTP, Prisma, amqplib e Temporal visíveis no Jaeger com o mesmo `traceId` |
| 13 | `traceparent` no envelope de evento | O consumidor de auditoria continua o trace iniciado na API |
| 14 | Métricas do outbox | Pendentes, idade do evento mais antigo e total em `DEAD_LETTER` expostos (endpoint ou métricas OTel) |

### P2 — Qualidade e desenvolvimento

| # | Item | Critério de aceite |
| --- | --- | --- |
| 15 | CI (GitHub Actions) | `pnpm install --frozen-lockfile && pnpm check` a cada push; replay do Temporal incluído |
| 16 | ESLint (flat config + typescript-eslint) | Script `lint` volta a existir e roda no CI sem erros |
| 17 | TanStack Query no web, começando pela tela de transações | `usePolling` manual substituído por `refetchInterval` condicional; invalidação após "Nova transação" |
| 18 | Limpeza | Remover `packages/*/.prettierrc` duplicados e os arquivos vazios de `apps/api/src/shared/domain` (ou implementá-los) |

## Fora do escopo

- Novos fluxos de domínio (transferências, contagens, lotes/FEFO). Entram na quinta sprint.
- Integração do analytics com eventos reais.
- Upgrades de versão major (Prisma 6, Express 5, pino 9, zod 4).
- Multi-tenancy. Nesta sprint será registrado apenas o ADR com a decisão, sem implementação.

## ADRs a escrever nesta sprint

Os quatro ADRs existentes em `docs/adr/` estão vazios. Prioridade:

1. ADR-005 — Monólito modular com um schema PostgreSQL por bounded context.
2. ADR-006 — Transactional Outbox com relay embutido na API.
3. ADR-007 — Versionamento de workflows com `patched()` e testes de replay obrigatórios.
4. Preencher ADR-001 a ADR-004 com as decisões que já estão no código.

## Riscos

| Risco | Mitigação |
| --- | --- |
| A migration falhar em um banco com dados reais | Ensaiar em uma cópia; manter o backup do schema `public`; a migration não usa DROP |
| Node 24 incompatível com algum binário nativo (Prisma engines, Temporal core) | Validar no P0 #4; em caso de falha, fixar `node:22` nas imagens temporariamente |
| O escopo de observabilidade crescer demais | Limitar a traces + `traceparent`; dashboards ficam para depois |
| PR grande demais para revisar | Commits separados por assunto (ver a sugestão em `terceira-sprint.md`) |

## Definição de pronto

- Código em branch com PR revisado e CI verde.
- Testes novos para cada item P0/P1 que tenha lógica.
- Demonstração executada em Docker, não apenas em testes.
- Documentação atualizada (`saga-demo.md`, plano de arquitetura e ADRs correspondentes).

## Demonstração prevista ao final

1. `pnpm prod:up` com todas as imagens em Node 24.
2. Iniciar uma transação no web e seguir o mesmo `traceId` no Jaeger, do BFF até o registro de auditoria.
3. Derrubar o RabbitMQ durante uma transação, religar e mostrar o outbox entregando os eventos pendentes sem perda.
4. Mostrar a reconciliação finalizando uma Saga cujo desfecho não foi reportado.
5. Mostrar o CI verde no PR.
