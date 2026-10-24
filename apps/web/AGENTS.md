# Instruções para agentes — Web

Escopo: `apps/web/**`. Há mudanças locais em andamento; leia os arquivos envolvidos antes de editar, preserve o trabalho existente e mantenha as alterações no escopo solicitado.

## Organização do serviço

- Frontend Next.js App Router com Feature-Sliced Design. `src/app` contém rotas, layouts, metadata e handlers BFF em `src/app/api`. Grupos de rota entre parênteses não compõem a URL.
- `src/views` contém telas e estado próprio de página; `src/widgets` contém o shell e blocos de interface; `src/features` contém ações do usuário; `src/entities` contém contratos de domínio, clientes e UI reutilizável; `src/shared` contém infraestrutura comum.
- `src/views` e `src/features` agrupam slices por domínio, com o mesmo vocabulário dos route groups do `app`: `<camada>/<domínio>/<slice>` (por exemplo, `app/(operations)/products` → `views/operations/products`). Os domínios são `operations`, `governance`, `identity`, `intelligence`, `platform` e `marketing`; `views/common` reúne telas usadas por vários domínios. A pasta do domínio contém apenas slices, sem código compartilhado entre elas.
- Importe outras slices pela entrada pública `index.ts`. Respeite o fluxo de dependências `app → views → widgets → features → entities → shared`; evite importações entre slices da mesma camada. Dentro da própria slice, use imports relativos.
- O navegador chama os clientes de `entities/*/api` via BFF `/api/*`; o token fica no cookie HTTP-only. Leituras iniciais em Server Components usam as entradas `entities/*/server`, a sessão da requisição e acesso direto à API. Preserve redirecionamento de sessão expirada e contratos HTTP.
- Dados demonstrativos compartilhados têm entradas explícitas `entities/*/testing`; não os exporte pela API de produção nem trate telas demonstrativas como integrações já implementadas. Consulte `src/entities/README.md` e o código vigente antes de estender uma entity.

## Ambiente e comandos

- Instale dependências na raiz do monorepo. Node >= 24.11 e pnpm 10.12.1 estão declarados no `package.json` da raiz.
- Para iniciar somente o web com o carregamento de ambiente do workspace: `pnpm dev:web` na raiz. `.env` da raiz fornece a base e `apps/web/.env` pode sobrescrever valores; segredos nunca pertencem a `NEXT_PUBLIC_*`.
- Para validar mudanças: `pnpm --filter @iron-ledger/web typecheck` (`next typegen` e TypeScript), `pnpm --filter @iron-ledger/web test` (testes `node:test` via `tsx`) e `pnpm build:web` quando um build de produção for necessário.
- `pnpm dev` na raiz inicia múltiplos serviços; `pnpm dev` dentro de `apps/web` inicia apenas o script Next e pode não reproduzir toda a configuração do lançador do workspace.
- Não execute comandos pnpm quando o usuário reservar essa validação para si. Nesse caso, informe os comandos adequados para execução local e deixe claro que não foram rodados.

## Ao concluir uma mudança

- Revise rotas, BFF, contratos e estados de sessão afetados. Para alterações de fronteira FSD, considere `tests/fsd-boundaries.test.ts`; para clientes HTTP, `tests/entities-api.test.ts`.
- Consulte `README.md`, `src/entities/README.md` e `docs/to-do.md` deste serviço. O documento `docs/architecture/frontend-fsd-proposal.md` registra a migração, mas tem trechos históricos; confirme sempre a estrutura atual em `src/`.
