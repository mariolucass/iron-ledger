# temporal-worker

Worker Temporal do iron-ledger. Cada área de negócio é um **módulo** autocontido; o
bootstrap descobre os módulos sozinho, então trabalhar em um módulo não exige editar
arquivos compartilhados (nem gera conflito de git entre devs).

```
src/
  worker.ts, bootstrap/     entrada, config, logger e a descoberta de módulos (não edite por feature)
  shared/                   ApiClient, token de serviço, GatewayError, contrato WorkerModule
  modules/<nome>/
    module.ts               exporta `workerModule` (monta as activities do módulo)
    contracts/              interfaces das activities (nomes e payloads são histórico do Temporal)
    ports/                  interfaces dos gateways que o módulo precisa
    gateways/               adaptadores HTTP para a API
    activities/             implementação das activities
    policies/               timeouts e retries por tipo de activity
    workflows/index.ts      exports dos workflows do módulo (roda no sandbox determinístico)
    tests/                  *.test.ts (unitário) e *.it.ts (Temporal real)
```

## Criar um módulo

1. Crie `modules/<nome>/` com as pastas acima e um `module.ts`:
   ```ts
   export const workerModule: WorkerModule = {
     name: "<nome>", // igual ao nome da pasta
     createActivities: ({ api, correlationId }) => ({ ...createXActivities(new XGateway(api), correlationId) }),
   };
   ```
2. Se tiver workflows, exporte-os em `workflows/index.ts`.
3. Contratos de tipos compartilhados com a API: crie `packages/workflow-contracts/<nome>.d.ts` e
   importe por subpath (`@iron-ledger/workflow-contracts/<nome>`). **Não** edite o `index.d.ts`.
4. Pronto: sem registrar em lugar nenhum. Nomes de activity duplicados entre módulos fazem o worker falhar ao subir.

## Regras (verificadas por `tests/architecture.test.ts`)

- Um módulo nunca importa outro módulo nem `bootstrap/`; `shared/` não conhece módulos.
- `workflows/` não importa `gateways/`, `activities/` nem `shared/` (sandbox determinístico).
- Nomes de workflows e de activities já gravados nunca são renomeados; mudar o comportamento de um
  workflow existente exige `patched(...)` e um teste de replay em `tests/replay/`.

## Comandos

- `pnpm test`: testes unitários (`src/**/*.test.ts`, `tests/**/*.test.ts`).
- `pnpm test:temporal`: integração e replay contra o servidor de testes do Temporal (`*.it.ts`).
- `pnpm dev`: worker com reinício ao editar activities. **Editar workflows não reinicia**: reinicie a mão.
