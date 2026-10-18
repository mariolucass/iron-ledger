# Proposta de organização FSD do frontend

Status: primeira migração implementada em 18/10/2026. O diagnóstico abaixo descreve a estrutura anterior; as ações candidatas continuam como evolução futura. Base: inspeção de `apps/web/src` e dos contratos HTTP de `apps/api`.

## Diagnóstico

A pasta `features` está organizada principalmente por telas e áreas do menu. Cada slice reúne composição de página, consultas, filtros, indicadores, detalhes e algumas ações do usuário. Os grupos `(identity)`, `(operations)` e similares ajudam a navegação, mas não definem por si só a responsabilidade de uma feature.

Problemas concretos:

- `features/**/ui/*Page.tsx` importa `widgets/layout/Layout`. A composição precisa ficar acima de widgets, na camada de páginas.
- `forecasting/ui/ForecastingPage.tsx` importa `mockWarehouses` de `features/(operations)/warehouses`. Uma tela depende da implementação de outra slice.
- `auth` mistura a página de login com formulário, validação e envio. Logout é uma ação de sessão implementada dentro de `widgets/layout/ui/UserDropdown.tsx`.
- `inventory/ui/InventoryPage.tsx` concentra consulta, filtros, histórico, drawer e abertura do formulário de movimento.
- Os detalhes e a listagem de transações estão no mesmo arquivo. O detalhe usa dados demonstrativos e recorre a uma transação fixa quando o ID não é encontrado.
- Há dados demonstrativos em `api/mocks.ts`, `model/*Data.ts` e dentro de componentes. A organização atual não indica de maneira consistente o que é dado de servidor, fixture ou estado da interface.

## Inventário de ações e comportamento atual

| Intenção do usuário | Implementação atual | Destino proposto |
| --- | --- | --- |
| Entrar com e-mail e senha | Integrada ao BFF e à API | `features/sign-in` |
| Sair da sessão | Integrada ao BFF; navegação no dropdown | `features/sign-out` |
| Registrar entrada, saída, ajuste ou retorno | `MovementDialog`, integrada ao estoque | `features/record-stock-movement` |
| Pesquisar saldo e filtrar por armazém | Estado e filtro locais sobre a consulta carregada | `_pages/inventory/model` e `ui` |
| Expandir histórico e abrir detalhe de saldo | Consulta real de movimentos e seleção local | `_pages/inventory` |
| Filtrar auditoria e inspecionar evento | Consulta real com fallback demonstrativo; filtros locais e drawer | `_pages/audit-log` |
| Filtrar, reconhecer, resolver e resolver todos os alertas | Dados demonstrativos; mudanças em memória | `_pages/alerts` inicialmente |
| Buscar e inspecionar usuários | Dados demonstrativos e drawer | `_pages/users` |
| Buscar e inspecionar armazéns | Dados demonstrativos mais ricos que o resumo público da API | `_pages/warehouses` |
| Filtrar transações e navegar ao detalhe | Dados demonstrativos e navegação | `_pages/transactions` e `_pages/transaction-detail` |
| Escolher período e pesquisar previsões | Dados demonstrativos e filtros locais | `_pages/forecasting` |
| Escolher tipo/formato e gerar relatório | Geração simulada por temporizador | `_pages/reports` |
| Alterar preferências e opções de segurança | Toggles em memória, sem persistência | `_pages/settings` |
| Navegar, buscar páginas e usar atalhos | Shell, sidebar e command palette | `widgets/layout` |

Recuperação de senha, SSO e passkey exibem avisos de indisponibilidade no fluxo de login. Botões de cadastro/edição sem operação implementada não justificam novas features nesta migração.

## Estrutura recomendada para a primeira migração

```text
apps/web/src/
  app/                          # Rotas Next, metadata, layout raiz e BFF atuais
  _pages/                       # Camada Pages do FSD; nome evita Pages Router
    login/
    inventory/
    audit-log/
    alerts/
    transactions/
    transaction-detail/
    warehouses/
    users/
    dashboard/
    forecasting/
    reports/
    settings/
    landing/
    design-system/
  widgets/
    layout/                     # Shell, header, sidebar, palette e dropdowns
  features/
    sign-in/
      model/
        login-schema.ts
        use-login-form.ts
        use-login-form-submit.ts
      ui/
        LoginFormWrapper.tsx
        LoginFormClient.tsx
      index.ts
    sign-out/
      model/use-sign-out.ts
      index.ts
    record-stock-movement/
      model/
        movement-schema.ts
        use-record-stock-movement.ts
      ui/MovementDialog.tsx
      index.ts
  entities/
    user/
    inventory/
    warehouse/
    audit-log/
    transaction/
  shared/
    api/
    auth/
    config/
    lib/
    ui/
```

Cada página terá `index.ts` e os segmentos necessários ao seu conteúdo, normalmente `ui/` e, quando houver lógica suficiente, `model/`. A camada `_pages` mantém a semântica de Pages; não é uma camada adicional. Para reduzir o escopo da migração, `src/app` continua concentrando a integração Next e as responsabilidades globais existentes, sem introduzir uma segunda camada `_app` neste momento.

Não criar diretórios vazios apenas para repetir `api/model/ui`. `sign-out`, por exemplo, pode expor apenas um hook consumido pelo dropdown. As chamadas HTTP já disponibilizadas pelas entities continuam ali; uma feature só precisa de `api/` se tiver integração própria que não esteja coberta por esses clientes.

## Distribuição das responsabilidades

### Páginas

Mover as telas completas para `_pages`. Manter ali composição visual, filtros exclusivos, seleção de linhas, abertura de drawers, estados de carregamento, mapeamentos de apresentação e dados demonstrativos específicos da tela.

A landing page e o design system são páginas. As seções exclusivas da landing podem permanecer em `_pages/landing/ui`; não precisam virar widgets individualmente. Tabelas e drawers usados apenas em uma página seguem o mesmo critério.

### Features

Usar slices com intenção explícita e fronteira de negócio clara. A primeira migração extrai as três ações existentes e integradas: `sign-in`, `sign-out` e `record-stock-movement`. Formulário, validação, envio, pendência e erros da ação ficam juntos. A página controla a abertura do diálogo e a atualização dos dados após sucesso.

Filtros exclusivos de uma tela, expansão de card e abertura de modal continuam locais. Não promover cada callback a feature. Reuso, importância do fluxo e crescimento da lógica justificam extração posterior.

### Widgets

Preservar o shell existente. O dropdown compõe o hook de `sign-out`. Extrair outros widgets apenas quando um bloco for reutilizado ou independente e grande o suficiente para ter responsabilidade própria. Não criar um widget para cada página inteira como etapa obrigatória.

### Entities e dados demonstrativos

Preservar os contratos das cinco entities atuais. Os view models de inventário e auditoria são próprios das telas e passam para `_pages/*/model`. Os adaptadores que hoje estão em `features/*/api/client.ts` podem ir para `_pages/*/model`, porque usam clientes existentes e apenas preparam dados para apresentação.

Os armazéns demonstrativos usados por previsão e pela tela de armazéns precisam de uma fonte comum inferior às páginas. Uma opção é um segmento de teste `entities/warehouse/testing`, com fixture e projeção demonstrativa explicitamente nomeadas. Importar por uma entrada própria de teste, sem exportar esses dados pelo `index.ts` de produção. Não ampliar silenciosamente o contrato `Warehouse` com zonas/capacidades que a API não retorna.

Os demais mocks podem permanecer junto à página em `model/fixtures.ts`. Não colocar dados de domínio em `shared` apenas para permitir imports entre telas.

## Fluxo de composição

```text
app/(operations)/inventory/page.tsx
  -> _pages/inventory
       -> widgets/layout
       -> features/record-stock-movement
            -> entities/inventory
                 -> shared/api/client
       -> entities/inventory + entities/warehouse (consulta e apresentação)
```

Importações externas usam a API pública da slice. Features não importam widgets, páginas ou outras features. Páginas compõem as ações e não importam outras páginas. Dentro da slice, usar imports relativos. Separar entradas de servidor e cliente caso uma API pública passe a misturar módulos `server-only` com componentes interativos.

## Ações candidatas para evolução posterior

| Slice candidata | Condição para implementação |
| --- | --- |
| `start-transaction` | Ligar um formulário real ao `transactionApi.start`, tratando pendência, erro e navegação para o workflow |
| `reserve-stock`, `release-stock-reservation`, `commit-stock-reservation` | Introduzir os fluxos de interface; os clientes HTTP já existem |
| `manage-alert-status` | Extrair as transições locais se o fluxo crescer ou for reutilizado; persistência depende de API de alertas |
| `generate-report` | Substituir o temporizador por geração/download real, ou justificar um módulo de demonstração independente |
| `update-account`, `update-notification-preferences`, `configure-security` | Definir contratos de persistência; hoje há controles demonstrativos |
| `invite-user`, `assign-user-role`, `create-warehouse` | Disponibilizar operações HTTP e comportamento de produto; não inferir integração a partir de botões |

Essas candidatas não entram como pastas vazias nem ganham endpoints fictícios. A compensação de transações atual é automática na saga; não propor uma ação manual de compensação como se já fosse suportada.

## Migração preservando os fluxos

1. Estabelecer a linha de base: executar typecheck, testes HTTP existentes e conferir rotas e interações atuais. Registrar quais telas usam mocks ou fallback.
2. Mover telas completas e seus arquivos locais para `_pages`, preservando o comportamento. Atualizar imports das rotas Next e manter URLs, metadata, parâmetros, cookies e BFF. Resolver a dependência de fixtures de armazéns no mesmo passo.
3. Extrair `sign-in` e `sign-out`. Página de login mantém layout e conteúdo; formulário e envio ficam na feature. Preservar avisos de recuperação/SSO/passkey e a navegação após login/logout.
4. Extrair `record-stock-movement`, recebendo opções de saldo por props. Schema, envio e erro ficam na feature. A página recarrega a consulta após sucesso. Pode passar callbacks e renderizar a feature em um slot do detalhe, sem fazer a entity importar a ação.
5. Separar os arquivos de listagem e detalhe de transações; manter seus dados demonstrativos nesta etapa. Tratar a troca do fallback por um erro de ID inexistente como mudança funcional separada.
6. Conferir importações, executar typecheck e testes, comparar os fluxos de login/logout, estoque, auditoria e interações demonstrativas. Executar build quando o ambiente permitir e revisar telas em navegador.

A primeira migração não muda filtros locais para filtros no servidor, não remove fallbacks demonstrativos e não troca o carregamento do shell para um layout persistente. Essas mudanças podem ser úteis, mas devem ser avaliadas separadamente porque alteram comportamento, ciclo de vida ou estados da aplicação.

Critérios de aceite: rotas e contratos HTTP preservados; ausência de páginas e imports de widgets dentro de features; ausência de imports entre slices de features; dados de demonstração identificáveis; formulário de movimento funcional; redirecionamento de sessão mantido; testes e tipos aprovados.

## Referências

A distinção entre páginas, features e widgets e a regra de dependências seguem a [referência de camadas FSD](https://feature-sliced.design/docs/reference/layers). O nome `_pages` segue a [orientação de integração com Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs). A escolha de manter inicialmente apenas três features e preservar o shell atual é específica deste projeto.

## Resultado da primeira migração

- As 14 telas estão em `src/_pages`, incluindo slices separadas para listagem e detalhe de transações. As rotas Next importam essas APIs públicas e preservam metadata e parâmetros.
- `features` contém apenas `sign-in`, `sign-out` e `record-stock-movement`. O shell compõe o hook de logout; a página de inventário abre o formulário e recarrega o saldo após sucesso.
- A validação de movimento passou para `model/movement-schema.ts`, alinhada às regras já exigidas pela API, e o envio/estado para `use-record-stock-movement.ts`.
- As consultas e os view models exclusivos de inventário e auditoria estão nos respectivos segmentos de página.
- Armazéns e transações de demonstração compartilhados usam entradas explícitas `entities/warehouse/testing` e `entities/transaction/testing`, sem ampliar contratos nem exports de produção.
- Fixtures exclusivas de landing e alertas foram movidas de `api/mocks.ts` para `model/fixtures.ts`.
- `fsd-boundaries.test.ts` verifica direção das dependências, APIs públicas, as três slices de ação e os imports das 14 rotas. `movement-schema.test.ts` cobre normalização e regras de quantidades. Os testes HTTP existentes continuam cobrindo os clientes das entities.

O build de produção foi tentado, mas o Next recebeu saída vazia do subprocesso TypeScript `--showConfig` neste ambiente. A configuração é retornada ao executar o comando diretamente; essa tentativa de build não valida a aplicação em produção. A checagem de tipos e os testes são executados separadamente. A navegação interativa em navegador precisa ser conferida no ambiente de desenvolvimento.
