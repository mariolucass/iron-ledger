#!/usr/bin/env bash
# Smoke test da demo: confere em ~30 s se tudo que a apresentação usa está de pé.
# Rode 1 h antes de apresentar. Imprime verde/vermelho por item com a ação corretiva.
# Uso: pnpm demo:check
#   API_URL      (padrão http://localhost:$DEMO_API_PORT, 3010)
#   WEB_URL      (padrão: detecta http://localhost:3002 e depois 3001)
#   TEMPORAL_UI  (padrão http://localhost:8088)
#   CHECK_STOCK_LEVEL  saldo usado na reserva de teste (padrão: Jaqueta de Couro)
# Efeito colateral: cria uma reserva de 1 un. e a libera em seguida; cria (uma vez) o
# usuário sem papéis demo-check@example.com para provar que a autorização funciona.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
set -a; [[ -f .env ]] && . ./.env; set +a

API_URL="${API_URL:-http://localhost:${DEMO_API_PORT:-3010}}"
TEMPORAL_UI="${TEMPORAL_UI:-http://localhost:8088}"
STOCK_LEVEL="${CHECK_STOCK_LEVEL:-30000000-0000-4000-8000-000000000003}"
TS="${TAILSCALE_BIN:-$(command -v tailscale || true)}"
[[ -n "$TS" ]] || TS="/mnt/c/Program Files/Tailscale/tailscale.exe"
NOROLE_EMAIL="demo-check@example.com"
NOROLE_PASS="DemoCheck12345!x"

if [[ -t 1 ]]; then G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; D=$'\e[2m'; N=$'\e[0m'; else G=; R=; Y=; D=; N=; fi
FAILS=0; WARNS=0
ok()   { echo "  ${G}✓${N} $1"; }
bad()  { echo "  ${R}✗${N} $1"; echo "      ${R}→ $2${N}"; FAILS=$((FAILS + 1)); }
warn() { echo "  ${Y}!${N} $1"; echo "      ${Y}→ $2${N}"; WARNS=$((WARNS + 1)); }
section() { echo; echo "$1"; }
json() { python3 -c "import json,sys
try:
  d=json.load(sys.stdin)
  print($1)
except Exception:
  print('')" 2>/dev/null; }
http() { curl -s -m "${3:-10}" -o /dev/null -w '%{http_code}' ${2:+-H "$2"} "$1" 2>/dev/null || echo 000; }
login() { curl -s -m 10 -X POST "$API_URL/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}" | json "d['accessToken']"; }

echo "Iron Ledger · smoke test da demo  ${D}($(date '+%H:%M:%S'))${N}"

section "1. Containers"
for svc in postgres rabbitmq temporal; do
  st="$(docker compose --profile platform ps "$svc" --format '{{.Status}}' 2>/dev/null | head -1)"
  if [[ "$st" == *healthy* && "$st" != *unhealthy* ]]; then ok "$svc saudável"
  elif [[ -z "$st" ]]; then bad "$svc não está rodando" "docker compose --profile platform up -d --wait $svc   (ou pnpm infra:platform)"
  else bad "$svc: $st" "docker compose --profile platform restart $svc e aguarde ficar healthy"; fi
done

section "2. API"
health="$(curl -s -m 5 "$API_URL/health" 2>/dev/null || true)"
if grep -q '"iron-ledger-api"' <<<"$health"; then ok "API do iron-ledger respondendo em $API_URL"
else
  if [[ -n "$health" ]]; then bad "$API_URL responde, mas NÃO é a API do iron-ledger (outro projeto na porta?)" "libere a porta ou use API_URL=http://localhost:<porta>; pnpm demo:funnel usa a 3010"
  else bad "nada responde em $API_URL" "suba a API: pnpm dev:api (ou pnpm demo:funnel). Verifique RabbitMQ saudável antes"; fi
  echo; echo "${R}Sem API não dá para testar o resto.${N}"; exit 1
fi

section "3. Login e papéis"
ADMIN_TOKEN="$(login "${SEED_ADMIN_EMAIL:-admin@ironledger.local}" "${SEED_ADMIN_PASSWORD:-ChangeMe123!}")"
if [[ -n "$ADMIN_TOKEN" ]]; then ok "ADMIN entra com SEED_ADMIN_EMAIL"
else bad "login do ADMIN falhou" "confira SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no .env e rode pnpm db:seed (atenção: pode redefinir a conta)"; fi

if [[ -n "${WORKER_SERVICE_EMAIL:-}" && -n "${WORKER_SERVICE_PASSWORD:-}" ]]; then
  [[ -n "$(login "$WORKER_SERVICE_EMAIL" "$WORKER_SERVICE_PASSWORD")" ]] && ok "SERVICE (worker) entra" \
    || bad "login da conta SERVICE falhou" "confira WORKER_SERVICE_EMAIL/PASSWORD e rode pnpm db:seed"
else
  warn "conta SERVICE não configurada: o worker usa as credenciais do ADMIN" "opcional: defina WORKER_SERVICE_EMAIL/PASSWORD no .env e rode pnpm db:seed"
fi

NOROLE_TOKEN="$(login "$NOROLE_EMAIL" "$NOROLE_PASS")"
if [[ -z "$NOROLE_TOKEN" ]]; then
  curl -s -m 10 -o /dev/null -X POST "$API_URL/auth/register" -H 'content-type: application/json' \
    -d "{\"name\":\"Demo Check\",\"email\":\"$NOROLE_EMAIL\",\"password\":\"$NOROLE_PASS\"}"
  NOROLE_TOKEN="$(login "$NOROLE_EMAIL" "$NOROLE_PASS")"
fi
if [[ -z "$NOROLE_TOKEN" ]]; then bad "usuário sem papéis não conseguiu entrar/cadastrar" "teste POST $API_URL/auth/register manualmente"
else
  code="$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$API_URL/inventory/movements" -H "Authorization: Bearer $NOROLE_TOKEN" \
    -H 'content-type: application/json' -d "{\"stockLevelId\":\"$STOCK_LEVEL\",\"type\":\"INBOUND\",\"quantity\":1}")"
  [[ "$code" == 403 ]] && ok "usuário sem papéis entra, mas é barrado ao movimentar estoque (403)" \
    || bad "usuário sem papéis recebeu $code ao movimentar (esperado 403)" "revise a autorização por papéis em apps/api/src/modules/inventory"
fi

section "4. Reserva → outbox → auditoria"
if [[ -z "$ADMIN_TOKEN" ]]; then bad "pulado: sem login do ADMIN" "corrija o item 3"
else
  AUTH="Authorization: Bearer $ADMIN_TOKEN"
  last_seq="$(curl -s -m 10 -H "$AUTH" "$API_URL/platform/outbox?pageSize=1" | json "d['items'][0]['sequence'] if d['items'] else 0")"
  last_seq="${last_seq:-0}"
  resp="$(curl -s -m 20 -X POST "$API_URL/inventory/reservations" -H "$AUTH" -H 'content-type: application/json' \
    -d "{\"stockLevelId\":\"$STOCK_LEVEL\",\"quantity\":1}" -w '\n%{http_code}')"
  code="$(tail -n1 <<<"$resp")"; rid="$(sed '$d' <<<"$resp" | json "d.get('id','')")"
  if [[ "$code" != 201 || -z "$rid" ]]; then
    bad "reserva válida falhou (HTTP $code)" "confira o saldo (CHECK_STOCK_LEVEL) e os logs da API"
  else
    ok "reserva criada (HTTP 201)"
    evid=""
    for _ in $(seq 1 15); do
      evid="$(curl -s -m 10 -H "$AUTH" "$API_URL/platform/outbox?pageSize=20" | json "next((i['id'] for i in d['items'] if int(i['sequence'])>$last_seq and i['eventName']=='Inventory.StockReserved' and i['aggregateId']=='$STOCK_LEVEL' and i['status']=='PUBLISHED'),'')")"
      [[ -n "$evid" ]] && break; sleep 1
    done
    [[ -n "$evid" ]] && ok "evento Inventory.StockReserved gravado no outbox e PUBLICADO" \
      || bad "evento não apareceu como PUBLISHED no outbox em 15 s" "RabbitMQ saudável? veja 'Outbox relay' em /system e os logs da API"
    if [[ -n "$evid" ]]; then
      found=""
      for _ in $(seq 1 15); do
        found="$(curl -s -m 10 -H "$AUTH" "$API_URL/audit?pageSize=20" | json "next((i['id'] for i in d['items'] if i['eventId']=='$evid'),'')")"
        [[ -n "$found" ]] && break; sleep 1
      done
      [[ -n "$found" ]] && ok "registro correspondente em audit_logs (via RabbitMQ)" \
        || bad "evento publicado, mas sem registro em audit_logs em 15 s" "o consumidor de auditoria da API não consumiu: reinicie a API e veja a fila no RabbitMQ (localhost:15672)"
    fi
    curl -s -m 10 -o /dev/null -X POST "$API_URL/inventory/reservations/$rid/release" -H "$AUTH" -H 'content-type: application/json' -d '{}'
  fi
fi

section "5. Temporal e worker"
[[ "$(http "$TEMPORAL_UI")" == 200 ]] && ok "Temporal UI acessível em $TEMPORAL_UI" \
  || bad "Temporal UI não responde em $TEMPORAL_UI" "docker compose --profile platform up -d temporal-ui"
if [[ -n "$ADMIN_TOKEN" ]]; then
  workers="$(curl -s -m 20 -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/platform/services" | json "next((x['value'] for s in d['services'] if s['key']=='temporal' or s['name']=='Temporal' for x in s['details'] if x['label']=='Workers ativos'),'')")"
  if [[ "${workers:-}" =~ ^[0-9]+$ && "$workers" -ge 1 ]]; then ok "worker do Temporal ativo (workers: $workers)"
  else bad "nenhum worker do Temporal ativo" "pnpm dev:worker (sem worker as transações ficam em PROCESSING)"; fi
fi

section "6. Web, analytics e funnel  ${D}(informativo)${N}"
WEB_URL="${WEB_URL:-}"
if [[ -z "$WEB_URL" ]]; then
  for p in 3002 3001; do [[ "$(http "http://localhost:$p/login")" == 200 ]] && { WEB_URL="http://localhost:$p"; break; }; done
fi
if [[ -n "$WEB_URL" && "$(http "$WEB_URL/login")" == 200 ]]; then ok "web respondendo em $WEB_URL"
else warn "web não encontrado em localhost:3002/3001" "pnpm demo:funnel (ou WEB_URL=... se estiver em outra porta)"; fi
[[ "$(http "http://localhost:${ANALYTICS_PORT:-8000}/health")" == 200 ]] && ok "serviço de analytics (Python) no ar" \
  || warn "analytics fora do ar: /analytics mostrará erro" "pnpm dev:analytics (plano: mostrar os dados via Prisma Studio)"
fstat="$("$TS" funnel status 2>&1 || true)"
if grep -q "Funnel on" <<<"$fstat"; then ok "funnel ligado: $(grep -o 'https://[^ ]*ts.net' <<<"$fstat" | head -1)"
else warn "funnel desligado" "só necessário se for apresentar por link público: pnpm demo:funnel"; fi

echo
if (( FAILS == 0 )); then echo "${G}✓ Demo pronta${N} (${WARNS} aviso(s))."; exit 0
else echo "${R}✗ ${FAILS} problema(s)${N} — corrija os itens em vermelho e rode de novo."; exit 1; fi
