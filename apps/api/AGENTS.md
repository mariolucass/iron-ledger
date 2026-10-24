# Instruções para agentes — API

Escopo: `apps/api/**`. Antes de alterar código, confira o estado atual dos arquivos envolvidos: este serviço tem trabalho local em andamento. Preserve mudanças existentes e limite as edições ao que foi pedido.

## Organização do serviço

- API Express/TypeScript, monólito modular. `src/main.ts` cria as dependências de processo; cada módulo compõe casos de uso e rotas em `src/modules/<módulo>/<módulo>.module.ts`, e `src/infra/http/router.ts` só os monta. Módulos em `src/modules/{identity,catalog,warehouse,inventory,transaction,audit,alerts,platform}`.
- Handlers HTTP usam `handle(status, run)` de `src/infra/http/handle.ts` em vez de `try/catch` com `next(error)`. Middlewares HTTP ficam em `src/infra/http/middlewares/` (headers de segurança, `rateLimit`, correlação, erros); listagens usam `pageQueryShape`/`pageQuerySchema` de `src/shared/utils/pagination.ts`. Papéis vêm do `requireRoles` em `identity/infra/guards/rbac.guard.ts` (`ADMIN` passa em tudo; `SERVICE_ROLE` é o worker).
- Em cada módulo, ponha invariantes em `domain`, casos de uso em `application` e HTTP/Prisma/consumidores em `infra`. Controllers não consultam Prisma diretamente; domínio não depende de Express, Prisma, RabbitMQ ou Temporal.
- `src/shared` guarda apenas primitivas comuns (`AggregateRoot`, `ValueObject`, `EVENT_PRODUCER`, erros, paginação). Contratos entre processos pertencem ao pacote compartilhado, mediante escopo autorizado pelo usuário.
- O schema Prisma multifile está em `prisma/schema/`; migrations em `prisma/migrations/` e seed em `prisma/seeds/`. Preserve as regras SQL que Prisma não expressa, especialmente integridade e auditoria append-only. Não edite migrations já aplicadas; crie uma nova quando necessário. Não use `db push` como substituto de migration.
- Mutações de estoque e outbox precisam manter atomicidade, correlação e idempotência. Eventos de domínio vão sempre para o outbox (`enqueueEvents`) na transação do estado; não publique direto no broker após o commit. Auditoria é imutável. Antes de mudar esses fluxos, leia os casos de uso, repositórios e consumidores correspondentes.

## Ambiente e comandos

- Execute comandos de workspace a partir da raiz do repositório. Node >= 24.11 e pnpm 10.12.1 estão declarados no `package.json` da raiz.
- `.env` da raiz é a base; `apps/api/.env` pode sobrescrever valores. O carregador da API também atende Prisma e seed. Não copie credenciais reais para arquivos versionados nem exponha valores de `.env` em respostas.
- Para desenvolvimento local: `pnpm dev:api`. Para checagens direcionadas: `pnpm --filter @iron-ledger/api typecheck`, `pnpm --filter @iron-ledger/api test` e `pnpm --filter @iron-ledger/api build`.
- Para Prisma, use os wrappers do projeto: `pnpm db:status`, `pnpm db:validate`, `pnpm db:generate`, `pnpm db:dev --name <nome>`, `pnpm db:deploy` e `pnpm db:seed`. `pnpm db:test:integrity` usa PostgreSQL descartável em Docker, conforme `prisma/tests/README.md`.
- `pnpm db:dev`, `pnpm db:deploy`, `pnpm db:seed` e especialmente `pnpm db:reset` alteram dados. Examine o alvo e o efeito antes de sugerir ou executar. Não execute comandos pnpm quando o usuário reservar essa validação para si.
- A coleção em `bruno/Iron Ledger/` descreve chamadas manuais. Confira a porta real: o ambiente Bruno usa `127.0.0.1:3002` como padrão; não assuma que a API está sempre na porta 3000.

## Ao concluir uma mudança

- Indique os comandos de validação pertinentes para o usuário executar, sem afirmar que passaram se não foram executados.
- Consulte `README.md` da raiz, `prisma/tests/README.md`, `bruno/Iron Ledger/README.md` e os documentos de arquitetura relevantes quando o fluxo mudar. Confirme no código o estado atual antes de tomar descrições antigas como fato.
