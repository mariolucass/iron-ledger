#!/usr/bin/env bash
# Demo pública: sobe Postgres, RabbitMQ, API e Web (build de produção) e expõe SÓ o web via Cloudflare Tunnel.
# O web chama a API pelo servidor (BFF), então a API continua em localhost.
# Uso: pnpm demo   (Ctrl+C encerra tudo)
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

command -v cloudflared >/dev/null || { echo "cloudflared não encontrado (~/.local/bin)."; exit 1; }

cleanup() {
  (( STOPPING == 0 )) || return 0
  STOPPING=1
  trap - EXIT INT TERM
  echo; echo "◌ Encerrando serviços da demo..."
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
  API_PORT="$API_PORT" setsid pnpm dev:api >"$LOG_DIR/api.log" 2>&1 &
  PIDS+=($!)
  for _ in $(seq 1 90); do is_iron_api && break; sleep 2; done
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

echo "5/5 Túnel..."
setsid bash -c 'cloudflared tunnel --no-autoupdate --url "$1" 2>&1 | tee "$2" | grep --line-buffered -E "trycloudflare.com|ERR"' \
  _ "http://localhost:$WEB_PORT" "$LOG_DIR/tunnel.log" &
PIDS+=($!)

echo; echo "Logs: $LOG_DIR  |  mantenha esta janela aberta e o PC sem suspender."
wait
