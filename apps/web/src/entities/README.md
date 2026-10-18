# Entities

Slices FSD baseadas nos contratos HTTP de `apps/api`. Cada slice expõe sua API pública em `index.ts`:

| Slice | `api/` | `model/` | `ui/` |
| --- | --- | --- | --- |
| `user` | Login e logout pelo BFF | Usuário público e contratos da sessão | Identificação do usuário |
| `warehouse` | Listagem de armazéns | Resumo público do armazém | Código e nome do armazém |
| `inventory` | Saldos, movimentos, criação/liberação/confirmação de reservas | Contratos, filtros e estados do estoque | Indicadores de saldo e tipo de movimento |
| `audit-log` | Consulta paginada com filtros | Registro de auditoria e ações | Indicador de ação |
| `transaction` | Início e consulta da saga | Workflow do Temporal e resultado da transação | Indicador de processamento, conclusão ou compensação |

## Dependências e responsabilidades

- `app`, `widgets` e `features` importam a API pública: `@/entities/inventory`.
- Uma slice não importa outra slice nem camadas superiores. A composição fica em `features` e `widgets`.
- `api/` chama o BFF `/api/*` usando `shared/api/client.ts`. O token permanece no cookie HTTP-only; `shared/api/backend.ts` é exclusivo do servidor.
- `model/` descreve os contratos públicos. Datas JSON são strings ISO, quantidades são números e campos anuláveis continuam anuláveis.
- `ui/` contém apresentação reutilizável da entidade. Formulários, navegação e casos de uso permanecem em `features`.
- Os adaptadores de inventário e auditoria em `views/*/model` transformam os contratos em dados da tela. Paginação e filtros continuam disponíveis nos clientes das entities.
- `withSession`, usado pelos adaptadores, preserva o redirecionamento de sessões expiradas; clientes de entities apenas propagam `ApiError`.

Produtos chegam como projeção na consulta de estoque e papéis como nomes na sessão. A API atual não expõe CRUD de produtos, usuários ou permissões. Não há clientes para endpoints inexistentes. Transações expõem workflows, não uma listagem CRUD. Um workflow `COMPLETED` pode conter uma transação `COMPENSATED`; o indicador distingue esses resultados.

## Validação

Na raiz do monorepo, após instalar as dependências:

```sh
pnpm --filter @iron-ledger/web typecheck
pnpm --filter @iron-ledger/web test
```

Os testes usam `tsx` (dependência do próprio web) e `node:test`, com HTTP simulado. Cobrem endpoints, paginação, filtros, codificação de IDs, mutações, autenticação via BFF e erros; não dependem dos serviços externos.
