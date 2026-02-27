#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

SERVE_PID_FILE="$RUN_DIR/serve.pid"
TUNNEL_SUP_PID_FILE="$RUN_DIR/tunnel-supervisor.pid"
TUNNEL_URL_FILE="$RUN_DIR/tunnel-url.txt"
TUNNEL_SUP_SCRIPT="$RUN_DIR/tunnel-supervisor.sh"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  [[ -n "$pid" ]] || return 1

  kill -0 "$pid" 2>/dev/null
}

start_serve() {
  if is_running "$SERVE_PID_FILE"; then
    return
  fi

  (
    cd "$ROOT_DIR"
    nohup npx --yes serve . -l 4173 >"$LOG_DIR/serve.log" 2>&1 &
    echo $! >"$SERVE_PID_FILE"
  )
}

write_tunnel_supervisor() {
  cat >"$TUNNEL_SUP_SCRIPT" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

cd "__ROOT_DIR__"
URL_FILE="__TUNNEL_URL_FILE__"
LOG_FILE="__TUNNEL_LOG_FILE__"

while true; do
  cloudflared tunnel --no-autoupdate --url http://127.0.0.1:4173 2>&1 \
    | tee -a "$LOG_FILE" \
    | awk '
      match($0,/https:\/\/[a-z0-9-]+\.trycloudflare\.com/) {
        url=substr($0,RSTART,RLENGTH);
        print url > urlFile;
        close(urlFile);
      }
    ' urlFile="$URL_FILE"

  sleep 2
done
EOF

  sed -i "s#__ROOT_DIR__#$ROOT_DIR#g" "$TUNNEL_SUP_SCRIPT"
  sed -i "s#__TUNNEL_URL_FILE__#$TUNNEL_URL_FILE#g" "$TUNNEL_SUP_SCRIPT"
  sed -i "s#__TUNNEL_LOG_FILE__#$LOG_DIR/cloudflared.log#g" "$TUNNEL_SUP_SCRIPT"

  chmod +x "$TUNNEL_SUP_SCRIPT"
}

start_tunnel_supervisor() {
  if is_running "$TUNNEL_SUP_PID_FILE"; then
    return
  fi

  write_tunnel_supervisor

  nohup bash "$TUNNEL_SUP_SCRIPT" >"$LOG_DIR/tunnel-supervisor.out" 2>&1 &
  echo $! >"$TUNNEL_SUP_PID_FILE"
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

wait_for_url() {
  local attempts=0
  while (( attempts < 30 )); do
    if [[ -f "$TUNNEL_URL_FILE" ]] && [[ -s "$TUNNEL_URL_FILE" ]]; then
      cat "$TUNNEL_URL_FILE"
      return 0
    fi

    attempts=$((attempts + 1))
    sleep 1
  done

  return 1
}

show_status() {
  echo "serve: $(is_running "$SERVE_PID_FILE" && echo running || echo stopped)"
  echo "tunnel-supervisor: $(is_running "$TUNNEL_SUP_PID_FILE" && echo running || echo stopped)"

  if [[ -f "$TUNNEL_URL_FILE" ]] && [[ -s "$TUNNEL_URL_FILE" ]]; then
    echo "url: $(cat "$TUNNEL_URL_FILE")"
  fi
}

case "${1:-start}" in
  start)
    start_serve
    start_tunnel_supervisor

    if url="$(wait_for_url 2>/dev/null)"; then
      echo "$url"
    else
      echo "Preview started, waiting for tunnel URL..."
    fi
    ;;

  url)
    if [[ -f "$TUNNEL_URL_FILE" ]] && [[ -s "$TUNNEL_URL_FILE" ]]; then
      cat "$TUNNEL_URL_FILE"
    else
      echo "No URL yet"
      exit 1
    fi
    ;;

  status)
    show_status
    ;;

  stop)
    stop_pid_file "$TUNNEL_SUP_PID_FILE"
    stop_pid_file "$SERVE_PID_FILE"
    ;;

  restart)
    "$0" stop
    "$0" start
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status|url}"
    exit 1
    ;;
esac
