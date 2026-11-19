#!/usr/bin/env bash
# Demo pública via Tailscale Funnel: sobe Postgres, RabbitMQ, API e Web (build de produção)
# e expõe SÓ o web na internet. Ao sair (Ctrl+C, erro ou fim do tempo), desliga o funnel e os serviços.
# O web chama a API pelo servidor (BFF), então a API continua em localhost.
# Uso: pnpm demo:funnel         (DEMO_TTL_MIN=60 muda o limite; 0 = sem limite)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/bin:$PATH"

WEB_PORT="${WEB_PORT:-3001}"
# Porta própria: 3000 costuma estar ocupada por outros projetos locais.
API_PORT="${DEMO_API_PORT:-3010}"
LOG_DIR="$(mktemp -d)"
PIDS=()
STOPPING=0

# Tailscale roda no Windows (WSL não tem o binário); o funnel aponta para 127.0.0.1 do Windows,
# que o WSL encaminha para a porta do web.
TS="${TAILSCALE_BIN:-$(command -v tailscale || true)}"
[[ -n "$TS" ]] || TS="/mnt/c/Program Files/Tailscale/tailscale.exe"
[[ -x "$TS" ]] || { echo "tailscale não encontrado. Defina TAILSCALE_BIN."; exit 1; }
FUNNEL_PORT=443
TTL_MIN="${DEMO_TTL_MIN:-120}"
FUNNEL_ON=0

funnel_off() { "$TS" funnel --https="$FUNNEL_PORT" off >/dev/null 2>&1 || true; }

cleanup() {
  (( STOPPING == 0 )) || return 0
  STOPPING=1
  trap - EXIT INT TERM
  echo; echo "◌ Desligando funnel..."
  funnel_off
  if "$TS" funnel status 2>&1 | grep -q "Funnel on"; then
    echo "! Funnel ainda ativo! Rode: \"$TS\" funnel --https=$FUNNEL_PORT off"
  else
    echo "✓ Funnel desligado."
  fi
  echo "◌ Encerrando serviços da demo..."
  local pid alive
  # Encerra os grupos criados pelo script sem afetar uma API externa reutilizada.
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] || continue
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  done
  for _ in $(seq 1 50); do
    alive=0
    for pid in "${PIDS[@]:-}"; do
      [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && alive=1
    done
    (( alive == 0 )) && break
    sleep 0.1
  done
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] || continue
    if kill -0 "$pid" 2>/dev/null; then
      echo "! PID $pid não respondeu; forçando encerramento."
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    wait "$pid" 2>/dev/null || true
  done
  echo "✓ Serviços da demo encerrados."
}
trap cleanup EXIT INT TERM

wait_for() { # url nome
  for _ in $(seq 1 90); do
    curl -fs -o /dev/null "$1" && return 0
    sleep 2
  done
  echo "Timeout aguardando $2 ($1). Logs em $LOG_DIR"; exit 1
}

free_port() { # porta serviço
  local port="$1" service="$2" pids pid details answer
  pids="$(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
  [[ -n "$pids" ]] || { echo "Porta $port ocupada; não foi possível identificar o processo."; return 1; }
  while read -r pid; do
    details="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    echo "Porta $port ($service) ocupada por PID $pid: ${details:-processo desconhecido}"
  done <<< "$pids"
  [[ -t 0 && -t 1 ]] || { echo "Terminal não interativo; processo mantido."; return 1; }
  read -r -p "Encerrar esse(s) processo(s) para liberar a porta? [y/N] " answer
  [[ "$answer" =~ ^([yY]|[sS]|[yY][eE][sS]|[sS][iI][mM])$ ]] || return 1
  while read -r pid; do kill -TERM "$pid" 2>/dev/null || echo "Não foi possível encerrar PID $pid"; done <<< "$pids"
  for _ in $(seq 1 20); do
    (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null || return 0
    sleep 0.1
  done
  echo "Porta $port continua ocupada; encerre o processo supervisor ou escolha outra porta."
  return 1
}

echo "1/5 Infra (Postgres + RabbitMQ)..."
docker compose up -d --wait postgres rabbitmq

echo "2/5 API..."
is_iron_api() { curl -fs -m 5 "http://localhost:$API_PORT/health" 2>/dev/null | grep -q '"iron-ledger-api"'; }
if is_iron_api; then
  echo "    API do iron-ledger já está na porta $API_PORT, reutilizando."
elif (exec 3<>"/dev/tcp/127.0.0.1/$API_PORT") 2>/dev/null; then
  free_port "$API_PORT" "API" || { echo "Use DEMO_API_PORT=<porta livre>."; exit 1; }
fi
if ! is_iron_api; then
  # O RabbitMQ pode aceitar conexão antes de estar pronto: se a API sair no bootstrap, tenta de novo.
  for attempt in 1 2 3 4; do
    API_PORT="$API_PORT" setsid pnpm dev:api >"$LOG_DIR/api.log" 2>&1 &
    api_pid=$!
    for _ in $(seq 1 90); do
      is_iron_api && break
      kill -0 "$api_pid" 2>/dev/null || break
      sleep 2
    done
    is_iron_api && { PIDS+=("$api_pid"); break; }
    kill -TERM -- "-$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
    (( attempt < 4 )) && { echo "    API não subiu (tentativa $attempt/4), tentando de novo em 8s..."; sleep 8; }
  done
  is_iron_api || { echo "API não subiu. Logs em $LOG_DIR"; tail -20 "$LOG_DIR/api.log"; exit 1; }
fi

echo "3/5 Build do web (produção)..."
pnpm build:web >"$LOG_DIR/web-build.log" 2>&1 || { tail -30 "$LOG_DIR/web-build.log"; exit 1; }

echo "4/5 Web..."
if (exec 3<>"/dev/tcp/127.0.0.1/$WEB_PORT") 2>/dev/null; then
  free_port "$WEB_PORT" "Web" || { echo "Use WEB_PORT=<porta livre>."; exit 1; }
fi
API_URL="http://localhost:$API_PORT" PORT="$WEB_PORT" setsid pnpm --filter @iron-ledger/web exec next start -p "$WEB_PORT" >"$LOG_DIR/web.log" 2>&1 &
PIDS+=($!)
wait_for "http://localhost:$WEB_PORT" "Web"

echo "5/5 Funnel..."
# Remove funnel antigo esquecido (ele persiste entre reinícios) antes de publicar o novo.
funnel_off
"$TS" funnel --bg --https="$FUNNEL_PORT" "http://127.0.0.1:$WEB_PORT" >"$LOG_DIR/funnel.log" 2>&1 \
  || { cat "$LOG_DIR/funnel.log"; echo "Falha ao ligar o funnel (Funnel habilitado no tailnet?)."; exit 1; }
FUNNEL_ON=1
URL="$(grep -oE 'https://[^ ]+\.ts\.net' "$LOG_DIR/funnel.log" | head -1 || true)"
[[ -n "$URL" ]] || URL="$("$TS" funnel status 2>&1 | grep -oE 'https://[^ ]+\.ts\.net' | head -1 || true)"

if [[ -n "$URL" ]]; then
  ok=0
  for _ in $(seq 1 20); do
    code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "$URL" || true)"
    [[ "$code" == 200 || "$code" == 307 || "$code" == 308 ]] && { ok=1; break; }
    sleep 2
  done
  (( ok )) || echo "! $URL respondeu $code. Se for 502, o Windows não alcança o web do WSL (localhostForwarding)."
fi

echo; echo "✓ Demo no ar: ${URL:-<veja 'tailscale funnel status'>}"
echo "  Logs: $LOG_DIR  |  Ctrl+C desliga tudo. Mantenha o PC sem suspender."
if (( TTL_MIN > 0 )); then
  echo "  Desliga sozinho em ${TTL_MIN} min."
  sleep "$((TTL_MIN * 60))" &
  wait $!
  echo "◌ Tempo da demo esgotado."
else
  while :; do sleep 3600 & wait $!; done
fi
