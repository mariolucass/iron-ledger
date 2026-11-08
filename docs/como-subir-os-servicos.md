# Como subir e olhar os serviços do Iron Ledger

Guia operacional geral. Se algo não sobe, comece pela seção [Diagnóstico rápido](#6-diagnóstico-rápido).

## 1. Duas camadas: infraestrutura e aplicações

Tudo se divide em duas coisas, que sobem **separadas**:

| Camada | O que é | Quem sobe | Comando base |
| --- | --- | --- | --- |
| **Infraestrutura** | Bancos, filas, Temporal, Kafka (containers) | Docker Compose | `pnpm infra:*` |
| **Aplicações** | API, Web, Worker Temporal, Analytics (código do repo) | Node/Python direto na máquina | `pnpm dev*` |

Regra de ouro: **`pnpm dev` não sobe containers.** Ele só verifica (preflight) se a infra existe e avisa ou pula o serviço que não tem dependência.

## 2. Para que serve cada serviço

| Serviço | Porta no host | Para que serve | Obrigatório? |
| --- | --- | --- | --- |
| **PostgreSQL** (compose) | `5433` | Banco principal (Prisma). Também é o banco do Temporal | Sim |
| **RabbitMQ** | `5672` / UI `15672` | Transporta eventos de domínio (ex.: estoque → auditoria) | Sim, exceto no modo `lite` |
| **Redis** | `6379` | Cache | Não |
| **API** (NestJS) | `3000` | Regras de negócio, outbox, endpoints | Sim |
| **Web** (Next.js) | `3001` | Interface + BFF | Sim |
| **Temporal Server** | `7233` | Guarda o estado/histórico dos workflows (sagas) | Só para transações/saga |
| **Temporal UI** | `8088` | Painel para ver workflows em execução | Não |
| **Worker Temporal** | — (sem web) | Executa os passos da saga (reservar → confirmar → compensar) chamando a API | Só para saga |
| **Kafka** | `9092` | Streaming de eventos, previsto para analytics. **Hoje não é usado no fluxo principal** | Não |
| **Analytics** (Python) | `8000` (`/docs`) | Pipeline/API de análise (dados Olist) | Não |
| **Jaeger** | `16686` | Traces (observabilidade) | Não |

Resumo mental: **RabbitMQ** = eventos do dia a dia; **Temporal** = processos longos com retry/compensação; **Kafka** = futuro/streaming (opcional).

> O Postgres do compose roda em **5433** porque a máquina tem outro Postgres (`local-postgres`) ocupando o 5432. Detalhe no `.env`: `POSTGRES_PORT=5433`. A `DATABASE_URL` do `.env` precisa apontar para a porta/credenciais do Postgres que você realmente quer usar.

## 3. Perfis do Docker Compose (por que "não sobe")

No `docker-compose.yml`, serviços opcionais ficam em **profiles**. Sem o profile, `docker compose up -d` **ignora** o serviço:

| Profile | Serviços | Atalho |
| --- | --- | --- |
| *(nenhum)* | postgres, rabbitmq, redis, api | `pnpm infra:up` |
| `platform` | kafka, temporal, temporal-ui | `pnpm infra:platform` |
| `worker` | temporal-worker (em container) | `docker compose --profile platform --profile worker up -d temporal-worker` |
| `analytics` | analytics | `pnpm infra:analytics` |
| `observability` | jaeger | `pnpm infra:observability` |

Também existe um **`docker-compose.override.yml` local** (ignorado pelo git, via `.git/info/exclude`). Ele é carregado automaticamente e faz duas coisas:

- `restart: "no"` em tudo → **os containers não voltam sozinhos quando o WSL/Docker reinicia**.
- Limites de RAM por container (Kafka 1 GB, Temporal 768 MB etc.).

## 4. Receitas de subida

Sempre na raiz do repo.

**Mínimo para desenvolver (API + Web, sem RabbitMQ):**

```bash
pnpm infra:db      # só Postgres
pnpm dev:lite      # API + Web com eventos em memória
```

**Dia a dia completo (com eventos reais):**

```bash
pnpm infra:core    # Postgres + RabbitMQ
pnpm db:deploy     # migrations (só na 1ª vez ou quando houver nova)
pnpm db:seed       # usuário admin (só na 1ª vez)
pnpm dev:api       # terminal 1
pnpm dev:web       # terminal 2
```

**Com saga/Temporal:**

```bash
pnpm infra:core
pnpm infra:platform   # kafka + temporal + temporal-ui
pnpm dev              # api + web + worker + analytics (worker é pulado se Temporal estiver fora)
# ou apenas: pnpm dev:worker
```

**Tudo em container (sem `pnpm dev`):** `pnpm infra:all`.

**Desligar:** `pnpm infra:down` (mantém dados) · `pnpm infra:nuke` (**apaga volumes/dados**).

> O `pnpm dev` nunca sobe Temporal/Kafka. Se o worker for pulado com "Temporal indisponível", o problema está na infra, não no script.

## 5. Como olhar cada serviço

```bash
pnpm infra:status                 # estado dos containers (docker compose ps)
pnpm infra:logs                   # logs de todos
docker compose logs -f temporal   # logs de um serviço
```

| O que | Onde |
| --- | --- |
| Web | http://localhost:3001 |
| API (saúde) | http://localhost:3000/health |
| Painel de serviços na própria app | `/platform/services` (mostra up/down de RabbitMQ, Temporal, Kafka, Analytics) |
| Temporal UI (workflows) | http://localhost:8088 |
| RabbitMQ (filas) | http://localhost:15672 (usuário/senha do `.env`) |
| Analytics (docs da API) | http://localhost:8000/docs |
| Jaeger | http://localhost:16686 |
| Banco | `pnpm db:studio` |
| Kafka (tópicos) | `docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:29092 --list` |

Teste rápido de portas:

```bash
for p in 5433 5672 7233 8088 9092; do (timeout 2 bash -c "</dev/tcp/127.0.0.1/$p" && echo "$p OK") 2>/dev/null || echo "$p FECHADA"; done
```

## 6. Diagnóstico rápido

### Temporal / Kafka "não funcionam"
Causa mais comum: **estão parados**, não quebrados.

1. Eles ficam no profile `platform` → `pnpm infra:up` **não** os sobe; use `pnpm infra:platform`.
2. O override local tem `restart: "no"` → após reiniciar o WSL/Docker, nada volta sozinho. Status `Exited (255)` é isso (parada por desligamento do Docker, não crash).
3. Confirme com `pnpm infra:status`.

(Verificado em 2026-10-29: ambos estavam `Exited (255)` há 4 dias; os logs terminavam em operação normal, sem erro. Subiram e ficaram `healthy` com `pnpm infra:platform`.)

### Kafka sobe, mas `localhost:9092` está fechada
Corrigido em 2026-10-29. O Kafka estava só na rede `messaging` (`internal: true`), que não publica portas no host. Agora ele também está na rede `app`, e `localhost:9092` responde. Containers continuam usando `kafka:29092`. Se a porta fechar de novo, recrie o container: `docker compose --profile platform up -d kafka`.

### Worker pulado
`pnpm dev` mostra "Temporal indisponível em localhost:7233" → suba `pnpm infra:platform`, espere `healthy` (~45 s de start_period) e rode `pnpm dev:worker`.

### API não inicia
Quase sempre Postgres (porta/credencial da `DATABASE_URL`) ou RabbitMQ fora. Use `pnpm dev:lite` para isolar RabbitMQ.

### Porta 5432 ocupada / credenciais recusadas (`P1000`)
É o `local-postgres` da máquina. Mantenha o Postgres do projeto em `5433` e alinhe `DATABASE_URL`.

## 7. Mapa dos scripts (o que cada um faz)

| Arquivo | Papel |
| --- | --- |
| `package.json` → `infra:*` | Atalhos de `docker compose` (sobem/derrubam containers) |
| `package.json` → `dev*` | Chamam `scripts/dev/run-app.mjs` (sobem apps) |
| `scripts/dev/run-app.mjs` | Entrada: monta presets (`lite`, `all`), compila `packages/`, roda preflight, supervisiona |
| `scripts/dev/services.mjs` | Define como iniciar cada app e o que ela exige (preflight) |
| `scripts/dev/supervisor.mjs` / `banner.mjs` | Mantém processos vivos / imprime resumo |
| `scripts/setup/*` | `pnpm setup*`: instala Node/Python (cache por hash) |
| `scripts/db/*` | Wrapper do Prisma e teste de integridade das migrations |
| `scripts/lib/*` | Código compartilhado (env, rede, processos) |
| `infra/compose/*` | Variações do compose (dev/prod); `prod:*` usa o de produção |

Presets de `pnpm dev`: **`lite`** = api+web, `EVENT_BUS=memory`; **`all`** = api+web+worker+analytics.

## 8. Pontos que confundem (a corrigir no futuro)

- `docs/guia-do-projeto.md` §10 cita `scripts/run-app.mjs` etc.; os caminhos reais são `scripts/dev/`, `scripts/setup/`, `scripts/db/`.
- `docs/temporal/saga-demo.md` assume Windows/PowerShell e portas 3002; aqui são bash/WSL, API 3000.
- Há três arquivos compose (`docker-compose.yml` na raiz e `infra/compose/*`); o dia a dia usa o da raiz.
- O `.env` aponta `DATABASE_URL` para `localhost:5432` enquanto `POSTGRES_PORT=5433`: confira qual banco a API usa.
