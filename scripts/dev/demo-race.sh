#!/usr/bin/env bash
# Demo de concorrência: dispara reservas simultâneas no mesmo saldo e mostra que só cabe uma.
# O saldo é protegido por bloqueio otimista (StockLevel.version), então não há overselling.
# As reservas vencedoras são liberadas no fim: o saldo volta ao valor original.
# Uso: pnpm demo:race   (API_URL, RACE_STOCK_LEVEL, RACE_QTY e RACE_ROUNDS mudam o cenário)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
set -a; [[ -f .env ]] && . ./.env; set +a

API_URL="${API_URL:-http://localhost:${DEMO_API_PORT:-3010}}"
# Padrão: Jaqueta de Couro (3 un.). Duas reservas de 2 un. nunca cabem juntas.
STOCK_LEVEL="${RACE_STOCK_LEVEL:-30000000-0000-4000-8000-000000000003}"
QTY="${RACE_QTY:-2}"
ROUNDS="${RACE_ROUNDS:-5}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fs -m 5 "$API_URL/health" | grep -q iron-ledger-api \
  || { echo "API do iron-ledger não responde em $API_URL (use API_URL=...)."; exit 1; }

TOKEN="$(curl -fs -m 10 -X POST "$API_URL/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"${SEED_ADMIN_EMAIL:?defina SEED_ADMIN_EMAIL}\",\"password\":\"${SEED_ADMIN_PASSWORD:?defina SEED_ADMIN_PASSWORD}\"}" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessToken"])')"
AUTH="Authorization: Bearer $TOKEN"

available() {
  curl -fs -m 10 -H "$AUTH" "$API_URL/inventory" | python3 -c "
import json,sys
d=json.load(sys.stdin); items=d['items'] if isinstance(d,dict) else d
print(next(i['available'] for i in items if i['stockLevelId']=='$STOCK_LEVEL'))"
}

BEFORE="$(available)"
echo "Saldo disponível: $BEFORE un. | cada requisição reserva $QTY un. | 2 requisições simultâneas por rodada"
wins_total=0; fails=0
for r in $(seq 1 "$ROUNDS"); do
  for k in a b; do
    ( curl -s -m 30 -X POST "$API_URL/inventory/reservations" -H "$AUTH" -H 'content-type: application/json' \
        -d "{\"stockLevelId\":\"$STOCK_LEVEL\",\"quantity\":$QTY}" -w '\n%{http_code}' >"$TMP/$k" ) &
  done
  wait
  wins=0; line=""
  for k in a b; do
    code="$(tail -n1 "$TMP/$k")"; body="$(sed '$d' "$TMP/$k")"
    if [[ "$code" == 201 ]]; then
      wins=$((wins + 1)); line+=" ✓201"
      id="$(printf '%s' "$body" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("id",""))')"
      [[ -n "$id" ]] && curl -s -o /dev/null -m 10 -X POST "$API_URL/inventory/reservations/$id/release" -H "$AUTH" -H 'content-type: application/json' -d '{}'
    else
      err="$(printf '%s' "$body" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("error","?"))' 2>/dev/null || echo '?')"
      line+=" ✗$code($err)"
    fi
  done
  echo "rodada $r:$line"
  wins_total=$((wins_total + wins))
  (( wins <= 1 )) || fails=$((fails + 1))
done

AFTER="$(available)"
echo "Vitórias por rodada ≤ 1 em $((ROUNDS - fails))/$ROUNDS rodadas | saldo antes=$BEFORE depois=$AFTER"
if (( fails == 0 )) && [[ "$BEFORE" == "$AFTER" ]]; then
  echo "✓ Sem overselling: só uma reserva vence por rodada e o saldo foi preservado."
else
  echo "✗ FALHA: houve overselling ou o saldo mudou."; exit 1
fi
