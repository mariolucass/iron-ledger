# Demonstração local da Saga de estoque com Temporal

> Validado em 02/10/2026: sucesso com baixa de 1 unidade, movimento e auditoria; falha simulada com compensação e saldo preservado. PostgreSQL, RabbitMQ e Temporal estavam ativos no Docker; API e worker rodavam localmente.

## O que está implementado

`POST /transactions` inicia um workflow Temporal com um ID UUID. O worker faz três etapas:

1. Reserva a quantidade pelo endpoint da API `POST /inventory/reservations`, identificando a reserva pelo ID da transação para que tentativas repetidas não criem outra reserva.
2. Confirma pelo endpoint `POST /inventory/reservations/:id/commit`. A API marca a reserva como `COMMITTED`, reduz `quantity` e `reserved` na mesma transação PostgreSQL, cria o movimento `OUTBOUND` e publica o evento para auditoria no RabbitMQ.
3. Se a confirmação falhar, chama `POST /inventory/reservations/:id/release`. A reserva passa a `RELEASED` e a quantidade reservada volta ao saldo disponível. `failConfirmation: true` simula essa falha para demonstrar a compensação.

`GET /transactions/:id` lê o estado do workflow no Temporal e retorna o resultado quando concluído. A interface atual de `/transactions` ainda usa dados demonstrativos; use a API e a Temporal UI para mostrar a Saga.

## Preparar o ambiente

Abra o Docker Desktop e espere o Engine responder a `docker info`. Em três terminais na raiz do projeto:

Se já existir um PostgreSQL local usando `5432`, resolva a disputa de porta antes do Compose: pare esse serviço **no terminal ou gerenciador em que você o administra**, ou escolha outra `POSTGRES_PORT` no `.env` e altere `DATABASE_URL` para a mesma porta. Nesta máquina foi observado um PostgreSQL em `5432` que rejeitou as credenciais de desenvolvimento (`P1000`); a mera presença da porta aberta não significa que o banco esperado esteja pronto. Não execute `pnpm db:seed` contra um banco não identificado.

```powershell
# Terminal 1: infraestrutura essencial e Temporal Server/UI
pnpm infra:core
docker compose --profile platform up -d temporal temporal-ui

# Apenas em instalação nova ou após acrescentar a migração da reserva:
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

```powershell
# Terminal 2: API e frontend
pnpm dev
```

```powershell
# Terminal 3: worker Temporal local
pnpm dev:worker
```

O `pnpm dev` lê o `.env` da raiz e inicia API e web. O worker usa `TEMPORAL_ADDRESS`, `TEMPORAL_TASK_QUEUE`, `API_URL`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` do mesmo arquivo. Na configuração local verificada, API e web usam `3002` e `3001`, respectivamente. Temporal UI usa `http://localhost:8088`.

Também é possível executar o worker em contêiner, com a API local rodando no host:

```powershell
docker compose --profile platform --profile worker up -d --build temporal-worker
```

O serviço de worker em contêiner acessa a API pelo endereço `host.docker.internal`. Use **uma** forma de iniciar o worker por vez para facilitar a leitura dos logs.

## Verificações antes da Saga

```powershell
Invoke-RestMethod http://localhost:3002/health
Invoke-WebRequest http://localhost:3001/login -UseBasicParsing
Invoke-WebRequest http://localhost:8088 -UseBasicParsing
docker compose ps
```

As portas devem corresponder ao seu `.env`. A API depende de PostgreSQL e RabbitMQ para iniciar; o worker depende do Temporal Server. Se `docker info` não funcionar, corrija o Docker Desktop antes de tentar a Saga.

## Executar o caso de sucesso

No PowerShell, informe o e-mail e a senha do usuário criado pelo seed sem colocar a senha em comandos gravados no vídeo:

```powershell
$email = Read-Host "E-mail do administrador local"
$password = Read-Host "Senha do administrador local"
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3002/auth/login -ContentType 'application/json' -Body (@{ email = $email; password = $password } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$inventory = Invoke-RestMethod -Uri http://localhost:3002/inventory -Headers $headers
$item = $inventory.items | Where-Object { $_.available -ge 1 } | Select-Object -First 1
$item | Select-Object sku, warehouseName, quantity, reserved, available
```

Se `$item` estiver vazio, revise o seed ou escolha um item com saldo disponível. Inicie a Saga:

```powershell
$body = @{ stockLevelId = $item.stockLevelId; quantity = 1; failConfirmation = $false } | ConvertTo-Json
$started = Invoke-RestMethod -Method Post -Uri http://localhost:3002/transactions -Headers $headers -ContentType 'application/json' -Body $body
$started | Select-Object workflowId, status
```

Abra a Temporal UI e localize `$started.workflowId`, ou consulte a API depois de alguns segundos:

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/transactions/$($started.workflowId)" -Headers $headers
```

O resultado esperado é `COMPLETED` com `reservationId` e `movementId`. Consulte novamente `/inventory`, o histórico do `stockLevelId` e `/audit` para ver a baixa e o evento. A auditoria é assíncrona; recarregue a consulta se ainda não tiver aparecido.

## Executar a compensação

Use outro item com disponível de pelo menos 1, ou o mesmo se ainda houver saldo. Envie `failConfirmation: true`:

```powershell
$body = @{ stockLevelId = $item.stockLevelId; quantity = 1; failConfirmation = $true } | ConvertTo-Json
$started = Invoke-RestMethod -Method Post -Uri http://localhost:3002/transactions -Headers $headers -ContentType 'application/json' -Body $body
Invoke-RestMethod -Uri "http://localhost:3002/transactions/$($started.workflowId)" -Headers $headers
```

Consulte novamente se o estado ainda for `RUNNING`. O resultado esperado é `COMPENSATED`: o `reserved` volta ao valor anterior e `quantity` não diminui. Na Temporal UI, mostre as atividades de reserva, falha de confirmação e compensação.

## Analytics, separadamente

`pnpm dev:analytics` inicia a API Python a partir de `services/analytics/.venv` e respeita `ANALYTICS_PORT`. A base SQLite precisa ter sido gerada pelo pipeline. A preparação dos CSVs e o comando do pipeline estão em [`../analytics/olist-first-step.md`](../analytics/olist-first-step.md). Consulte `http://localhost:8000/health`, `/analytics/summary` e `/analytics/inflection-points`. O laboratório Olist **não consome** os eventos dessa Saga; são demonstrações separadas.

## Limites atuais

- O worker autentica na API com o usuário local configurado para o seed. Esse é um mecanismo de desenvolvimento; uma instalação compartilhada precisa de identidade própria para serviço.
- A publicação RabbitMQ ocorre depois da transação PostgreSQL. As etapas repetidas da Saga reutilizam a mesma reserva e o mesmo movimento, e o consumidor de auditoria deduplica IDs de evento. Ainda não há outbox transacional para garantir entrega em uma falha permanente do broker.
- A transação é acompanhada pelo histórico do Temporal; não há uma tabela operacional de transações nem tela web conectada para esse workflow.
