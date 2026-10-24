# scripts/

| Pasta          | Papel                                                                 |
| -------------- | --------------------------------------------------------------------- |
| `lib/`         | Base compartilhada: registro dos serviços, env, processos, rede, cores |
| `dev/`         | `pnpm dev*` — preflight, banner e supervisão dos serviços             |
| `setup/`       | `pnpm setup*` — instalação Node/Python com cache por hash             |
| `db/`          | Wrapper do Prisma e teste de integridade das migrations               |
| `postinstall/` | Patches aplicados após `pnpm install`                                 |

- `lib/workspace.cjs` é a fonte única de diretórios e filtros pnpm dos serviços.
- `lib/*.cjs` é consumido também pela API (TypeScript) e copiado no `api.Dockerfile`.
- Testes: `pnpm test:scripts` (`**/*.test.mjs`).
