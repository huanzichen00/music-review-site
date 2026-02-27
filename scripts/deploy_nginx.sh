#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

FRONTEND_TARGET_DIR="${FRONTEND_TARGET_DIR:-/var/www/music-review}"
BACKEND_TARGET_JAR="${BACKEND_TARGET_JAR:-/opt/music-review/app.jar}"
BACKEND_SERVICE="${BACKEND_SERVICE:-music-review}"

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://127.0.0.1/api/albums}"
FRONTEND_HEALTH_URL="${FRONTEND_HEALTH_URL:-http://127.0.0.1/}"

log() {
  printf '[deploy-nginx] %s\n' "$*"
}

err() {
  printf '[deploy-nginx] ERROR: %s\n' "$*" >&2
}

usage() {
  cat <<'USAGE'
Usage:
  scripts/deploy_nginx.sh [command]

Commands:
  deploy            Build + publish + restart backend + reload nginx + health check (default)
  build             Build frontend and backend artifacts only
  publish_frontend  Sync frontend dist to nginx root
  publish_backend   Copy backend jar to service path
  restart_backend   Restart backend systemd service
  reload_nginx      Validate and reload nginx config
  check             Check frontend/backend HTTP status
  status            Show service status
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "missing required command: $1"
    exit 1
  fi
}

wait_http_ok() {
  local url="$1"
  local timeout_secs="${2:-60}"
  local elapsed=0
  local code

  while (( elapsed < timeout_secs )); do
    code="$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' "$url" || true)"
    if [[ "$code" == "200" ]]; then
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
  npm run build
  popd >/dev/null
}

build_backend() {
  log "Building backend..."
  pushd "$BACKEND_DIR" >/dev/null
  ./mvnw -DskipTests package
  popd >/dev/null
}

publish_frontend() {
  if [[ ! -d "$FRONTEND_DIR/dist" ]]; then
    err "frontend dist not found. Run build first."
    exit 1
  fi

  log "Publishing frontend to $FRONTEND_TARGET_DIR ..."
  rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_TARGET_DIR/"
  chown -R www-data:www-data "$FRONTEND_TARGET_DIR"
}

publish_backend() {
  local jar_file
  jar_file="$(ls "$BACKEND_DIR"/target/backend-*.jar 2>/dev/null | grep -v '\.original$' | head -n 1 || true)"
  if [[ -z "$jar_file" ]]; then
    err "backend jar not found. Run build first."
    exit 1
  fi

  log "Publishing backend jar to $BACKEND_TARGET_JAR ..."
  install -m 644 "$jar_file" "$BACKEND_TARGET_JAR"
  chown musicapp:musicapp "$BACKEND_TARGET_JAR"
}

restart_backend() {
  log "Restarting backend service: $BACKEND_SERVICE"
  systemctl restart "$BACKEND_SERVICE"
}

reload_nginx() {
  log "Reloading nginx..."
  nginx -t
  systemctl reload nginx
}

check_health() {
  log "Checking frontend: $FRONTEND_HEALTH_URL"
  if wait_http_ok "$FRONTEND_HEALTH_URL" 20; then
    log "Frontend OK"
  else
    err "Frontend health check failed: $FRONTEND_HEALTH_URL"
    exit 1
  fi

  log "Checking backend: $BACKEND_HEALTH_URL"
  if wait_http_ok "$BACKEND_HEALTH_URL" 60; then
    log "Backend OK"
  else
    err "Backend health check failed: $BACKEND_HEALTH_URL"
    exit 1
  fi
}

status_services() {
  systemctl status --no-pager nginx "$BACKEND_SERVICE" | sed -n '1,40p'
}

deploy_all() {
  build_frontend
  build_backend
  publish_frontend
  publish_backend
  restart_backend
  reload_nginx
  check_health
  log "Deploy completed"
}

main() {
  require_cmd npm
  require_cmd curl
  require_cmd rsync
  require_cmd systemctl
  require_cmd nginx
  require_cmd java

  local cmd="${1:-deploy}"
  case "$cmd" in
    deploy)
      deploy_all
      ;;
    build)
      build_frontend
      build_backend
      ;;
    publish_frontend)
      publish_frontend
      ;;
    publish_backend)
      publish_backend
      ;;
    restart_backend)
      restart_backend
      ;;
    reload_nginx)
      reload_nginx
      ;;
    check)
      check_health
      ;;
    status)
      status_services
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      err "unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"
