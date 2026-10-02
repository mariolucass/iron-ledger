# Iron Ledger no Bruno

Inicie a API com `pnpm dev:api` na raiz do projeto. Abra esta pasta como coleção no [Bruno](https://docs.usebruno.com/get-started/bruno-basics/create-a-collection) e selecione o ambiente `local`. O `baseurl` padrão usa `http://127.0.0.1:3002`, conforme `API_PORT` no `.env` da raiz. Se iniciar a API diretamente em `apps/api` ou alterar a porta, ajuste o `baseurl` para a porta em uso.

1. Preencha `password` no ambiente `local` com a senha do usuário disponível no seu banco. Com o seed local do projeto, use a senha configurada para `SEED_ADMIN_PASSWORD`.
2. Execute **Auth / Login**. O script salva `accessToken` apenas como variável de execução do Bruno; o token expira conforme `JWT_EXPIRES_IN`.
3. Execute as rotas protegidas. Para chamadas de inventário, substitua `stockLevelId` pelo UUID de um saldo existente. Para liberar uma reserva, substitua `reservationId` pelo UUID retornado na criação.

As chamadas de criação e liberação de estoque modificam dados e podem publicar eventos. O ambiente versionado contém somente valores de exemplo. Não salve senhas ou tokens reais nos arquivos da coleção.
