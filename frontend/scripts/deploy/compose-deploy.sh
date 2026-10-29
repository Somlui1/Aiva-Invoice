#!/bin/sh
# =============================================================================
# AIVA Portal — build / deploy / rollback with docker compose (one compose file, as in v5.12)
#
#   sh scripts/deploy/compose-deploy.sh build      image aiva-portal:<version>-<sha> (+ :latest)
#   sh scripts/deploy/compose-deploy.sh up         start that image, wait for /api/health, auto-rollback on failure
#   sh scripts/deploy/compose-deploy.sh rollback   go back to the image that ran before the last deploy
#
# State: $AIVA_DEPLOY_STATE (default ~/.aiva-deploy): current · previous image tags — kept OUTSIDE the
#        checkout because CI cleans untracked files between jobs. The SQLite volume is never touched.
# =============================================================================
set -eu
cd "$(dirname "$0")/../.."

VERSION=$(node -p "require('./package.json').version")
SHA=$(git rev-parse --short HEAD 2>/dev/null || date +%s)
TAG="${AIVA_IMAGE_TAG:-$VERSION-$SHA}"
STATE="${AIVA_DEPLOY_STATE:-$HOME/.aiva-deploy}"
HEALTH_TRIES=${HEALTH_TRIES:-30}
mkdir -p "$STATE"

compose() { docker compose -p aiva-portal "$@"; }

wait_healthy() {
  i=0
  while [ "$i" -lt "$HEALTH_TRIES" ]; do
    st=$(docker inspect -f '{{.State.Health.Status}}' aiva-portal 2>/dev/null || echo none)
    [ "$st" = "healthy" ] && return 0
    [ "$st" = "unhealthy" ] && return 1
    i=$((i + 1))
    sleep 4
  done
  return 1
}

start_tag() {
  AIVA_IMAGE_TAG="$1" compose up -d --no-build --force-recreate portal
}

case "${1:-}" in
  build)
    echo "[deploy] build aiva-portal:$TAG"
    AIVA_IMAGE_TAG="$TAG" compose build portal
    docker tag "aiva-portal:$TAG" aiva-portal:latest
    ;;
  up)
    docker image inspect "aiva-portal:$TAG" >/dev/null 2>&1 || { echo "[deploy] image aiva-portal:$TAG not built"; exit 1; }
    PREV=$(cat "$STATE/current" 2>/dev/null || echo "")
    echo "[deploy] $PREV → $TAG"
    start_tag "$TAG"
    if wait_healthy; then
      [ -n "$PREV" ] && [ "$PREV" != "$TAG" ] && echo "$PREV" > "$STATE/previous"
      echo "$TAG" > "$STATE/current"
      echo "[deploy] ✔ healthy · aiva-portal:$TAG"
      # keep the 3 newest images
      docker images aiva-portal --format '{{.Tag}}' | grep -v -e latest -e "$TAG" -e "${PREV:-^$}" | tail -n +3 | \
        while read -r t; do docker rmi "aiva-portal:$t" >/dev/null 2>&1 || true; done
    else
      echo "[deploy] ✖ aiva-portal:$TAG not healthy"
      compose logs --tail=80 portal || true
      if [ -n "$PREV" ]; then
        echo "[deploy] ↩ auto-rollback → $PREV"
        start_tag "$PREV"
        wait_healthy && echo "[deploy] rollback healthy" || echo "[deploy] rollback NOT healthy — check the server"
      fi
      exit 1
    fi
    ;;
  rollback)
    PREV=$(cat "$STATE/previous" 2>/dev/null || echo "")
    [ -n "$PREV" ] || { echo "[deploy] no previous image recorded"; exit 1; }
    CUR=$(cat "$STATE/current" 2>/dev/null || echo "")
    echo "[deploy] rollback $CUR → $PREV"
    start_tag "$PREV"
    wait_healthy || { echo "[deploy] ✖ previous image not healthy"; exit 1; }
    echo "$PREV" > "$STATE/current"
    [ -n "$CUR" ] && echo "$CUR" > "$STATE/previous"
    echo "[deploy] ✔ rolled back to aiva-portal:$PREV"
    ;;
  *)
    echo "usage: compose-deploy.sh build|up|rollback"
    exit 2
    ;;
esac
