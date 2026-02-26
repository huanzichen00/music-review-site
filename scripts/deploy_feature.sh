#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

RUNTIME_DIR="${RUNTIME_DIR:-/tmp/music-review-site}"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"

log() {
  printf '[deploy] %s\n' "$*"
}

err() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy_feature.sh [command]

Commands:
  deploy   Build + restart services + health check (default)
  build    Build frontend and backend only
  start    Start services only (requires built artifacts)
  stop     Stop services started by this script
  status   Show service status
  logs     Show tail logs
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "missing required command: $1"
    exit 1
  fi
}

ensure_runtime_dir() {
  mkdir -p "$RUNTIME_DIR"
}

pid_is_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

read_pid() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    tr -d '[:space:]' < "$pid_file"
  fi
}

remove_pid_file_if_stale() {
  local pid_file="$1"
  local pid
  pid="$(read_pid "$pid_file")"
  if [[ -n "${pid:-}" ]] && ! pid_is_running "$pid"; then
    rm -f "$pid_file"
  fi
}

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
  else
    ss -ltn "( sport = :$port )" 2>/dev/null | tail -n +2 | grep -q .
  fi
}

assert_port_available() {
  local port="$1"
  local service_name="$2"
  if port_in_use "$port"; then
    err "$service_name port $port is already in use. Stop existing process first."
    exit 1
  fi
}

wait_http_ready() {
  local url="$1"
  local timeout_secs="${2:-45}"
  local elapsed=0
  local code

  while (( elapsed < timeout_secs )); do
    code="$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' "$url" || true)"
    if [[ "$code" != "000" ]]; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  return 1
}

build_frontend() {
  log "Building frontend..."
  pushd "$FRONTEND_DIR" >/dev/null
  if [[ ! -d node_modules ]]; then
    npm install
  fi
  npm run lint
  npm run build
  popd >/dev/null
}

build_backend() {
  log "Building backend..."
  pushd "$BACKEND_DIR" >/dev/null
  ./mvnw -DskipTests package
  popd >/dev/null
}

start_backend() {
  remove_pid_file_if_stale "$BACKEND_PID_FILE"
  local existing_pid
  existing_pid="$(read_pid "$BACKEND_PID_FILE")"
  if [[ -n "${existing_pid:-}" ]] && pid_is_running "$existing_pid"; then
    log "Backend already running (pid: $existing_pid)"
    return 0
  fi

  assert_port_available "$BACKEND_PORT" "backend"

  local jar_file
  jar_file="$(ls "$BACKEND_DIR"/target/backend-*.jar 2>/dev/null | grep -v '\.original$' | head -n 1 || true)"
  if [[ -z "$jar_file" ]]; then
    err "backend jar not found. Run: scripts/deploy_feature.sh build"
    exit 1
  fi

  log "Starting backend on port $BACKEND_PORT..."
  nohup java -jar "$jar_file" >"$BACKEND_LOG" 2>&1 &
  echo "$!" > "$BACKEND_PID_FILE"

  if wait_http_ready "http://127.0.0.1:$BACKEND_PORT/api/albums" 60; then
    log "Backend is ready: http://127.0.0.1:$BACKEND_PORT"
  else
    err "backend failed to become ready. Check log: $BACKEND_LOG"
    exit 1
  fi
}

start_frontend() {
  remove_pid_file_if_stale "$FRONTEND_PID_FILE"
  local existing_pid
  existing_pid="$(read_pid "$FRONTEND_PID_FILE")"
  if [[ -n "${existing_pid:-}" ]] && pid_is_running "$existing_pid"; then
    log "Frontend already running (pid: $existing_pid)"
    return 0
  fi

  assert_port_available "$FRONTEND_PORT" "frontend"

  if [[ ! -d "$FRONTEND_DIR/dist" ]]; then
    err "frontend dist not found. Run: scripts/deploy_feature.sh build"
    exit 1
  fi

  log "Starting frontend on port $FRONTEND_PORT..."
  pushd "$FRONTEND_DIR" >/dev/null
  nohup npm run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 &
  echo "$!" > "$FRONTEND_PID_FILE"
  popd >/dev/null

  if wait_http_ready "http://127.0.0.1:$FRONTEND_PORT/" 30; then
    log "Frontend is ready: http://127.0.0.1:$FRONTEND_PORT"
  else
    err "frontend failed to become ready. Check log: $FRONTEND_LOG"
    exit 1
  fi
}

stop_service() {
  local service_name="$1"
  local pid_file="$2"

  remove_pid_file_if_stale "$pid_file"
  local pid
  pid="$(read_pid "$pid_file")"
  if [[ -z "${pid:-}" ]]; then
    log "$service_name is not running"
    return 0
  fi

  if pid_is_running "$pid"; then
    log "Stopping $service_name (pid: $pid)..."
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
    if pid_is_running "$pid"; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  fi

  rm -f "$pid_file"
  log "$service_name stopped"
}

status_service() {
  local service_name="$1"
  local pid_file="$2"
  remove_pid_file_if_stale "$pid_file"
  local pid
  pid="$(read_pid "$pid_file")"

  if [[ -n "${pid:-}" ]] && pid_is_running "$pid"; then
    printf '%-8s running (pid: %s)\n' "$service_name" "$pid"
  else
    printf '%-8s stopped\n' "$service_name"
  fi
}

show_logs() {
  echo "== backend log =="
  if [[ -f "$BACKEND_LOG" ]]; then
    tail -n 40 "$BACKEND_LOG"
  else
    echo "no backend log found"
  fi
  echo
  echo "== frontend log =="
  if [[ -f "$FRONTEND_LOG" ]]; then
    tail -n 40 "$FRONTEND_LOG"
  else
    echo "no frontend log found"
  fi
}

build_all() {
  build_frontend
  build_backend
}

start_all() {
  ensure_runtime_dir
  start_backend
  start_frontend
}

stop_all() {
  stop_service "frontend" "$FRONTEND_PID_FILE"
  stop_service "backend" "$BACKEND_PID_FILE"
}

deploy_all() {
  ensure_runtime_dir
  stop_all
  build_all
  start_all
  log "Deploy completed."
  log "Frontend: http://127.0.0.1:$FRONTEND_PORT/music/guess-band"
  log "Backend:  http://127.0.0.1:$BACKEND_PORT"
}

main() {
  require_cmd npm
  require_cmd java
  require_cmd curl

  local command="${1:-deploy}"
  case "$command" in
    deploy)
      deploy_all
      ;;
    build)
      build_all
      ;;
    start)
      start_all
      ;;
    stop)
      stop_all
      ;;
    status)
      status_service "backend" "$BACKEND_PID_FILE"
      status_service "frontend" "$FRONTEND_PID_FILE"
      ;;
    logs)
      show_logs
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      err "unknown command: $command"
      usage
      exit 1
      ;;
  esac
}

main "${1:-deploy}"
