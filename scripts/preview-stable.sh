#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

SERVE_PID_FILE="$RUN_DIR/serve-stable.pid"
TUNNEL_PID_FILE="$RUN_DIR/tunnel-stable.pid"

PUBLIC_URL="https://preview.reviewallride.org"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  [[ -n "$pid" ]] || return 1

  kill -0 "$pid" 2>/dev/null
}

stop_pid_file() {
  local pid_file="$1"

  if ! [[ -f "$pid_file" ]]; then
    return
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
  fi

  rm -f "$pid_file"
}

start_serve() {
  if is_running "$SERVE_PID_FILE"; then
    return
  fi

  (
    cd "$ROOT_DIR"
    nohup npx --yes serve . -l 4173 >"$LOG_DIR/serve-stable.log" 2>&1 &
    echo $! >"$SERVE_PID_FILE"
  )
}

start_tunnel() {
  if is_running "$TUNNEL_PID_FILE"; then
    return
  fi

  nohup cloudflared tunnel --config /home/rdnsta/.cloudflared/config.yml run nco205-preview >"$LOG_DIR/cloudflared-stable.log" 2>&1 &
  echo $! >"$TUNNEL_PID_FILE"
}

show_status() {
  echo "serve: $(is_running "$SERVE_PID_FILE" && echo running || echo stopped)"
  echo "cloudflared: $(is_running "$TUNNEL_PID_FILE" && echo running || echo stopped)"
  echo "url: $PUBLIC_URL"
}

case "${1:-start}" in
  start)
    start_serve
    start_tunnel
    echo "$PUBLIC_URL"
    ;;

  stop)
    stop_pid_file "$TUNNEL_PID_FILE"
    stop_pid_file "$SERVE_PID_FILE"
    ;;

  restart)
    "$0" stop
    "$0" start
    ;;

  status)
    show_status
    ;;

  url)
    echo "$PUBLIC_URL"
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status|url}"
    exit 1
    ;;
esac
