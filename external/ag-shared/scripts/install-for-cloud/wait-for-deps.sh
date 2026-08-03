#!/usr/bin/env bash
# external/ag-shared/scripts/install-for-cloud/wait-for-deps.sh
#
# Block until the background `yarn install` started by install-for-cloud.sh has
# finished, then exit 0. Run this in a cloud session before any build, test or
# lint command when the SessionStart notice said dependencies were not ready.
#
# Exits 0 immediately when no install is in flight and node_modules looks valid,
# so it is safe to call unconditionally.
#
#   bash external/ag-shared/scripts/install-for-cloud/wait-for-deps.sh [timeout_seconds]

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"
AG_CLOUD_CACHE_DIR="${AG_CLOUD_CACHE_DIR:-$HOME/.cache/ag-cloud}"
STATE="$AG_CLOUD_CACHE_DIR/deps"
TIMEOUT="${1:-900}"

log() { echo "[wait-for-deps] $*"; }

cd "$REPO_ROOT" || exit 1

if [[ -f "$STATE/failed" ]]; then
    log "the background install FAILED — last 30 lines:"
    tail -30 "$STATE/install.log" 2>/dev/null
    log "re-run it yourself: yarn install --prefer-offline"
    exit 1
fi

# Nothing in flight: trust the tree if yarn is happy with it.
if [[ ! -d "$STATE/lock" && ! -f "$STATE/started" ]]; then
    if [[ -d node_modules ]] && yarn check --integrity &>/dev/null; then
        log "dependencies already present and valid"
        exit 0
    fi
    log "no install in flight and node_modules is missing or stale"
    log "run: yarn install --prefer-offline"
    exit 1
fi

log "waiting for the background install (timeout ${TIMEOUT}s)"
start=$SECONDS
while ((SECONDS - start < TIMEOUT)); do
    if [[ -f "$STATE/ready" ]]; then
        log "dependencies ready after $((SECONDS - start))s of waiting"
        exit 0
    fi
    if [[ -f "$STATE/failed" ]]; then
        log "the background install FAILED after $((SECONDS - start))s — last 30 lines:"
        tail -30 "$STATE/install.log" 2>/dev/null
        exit 1
    fi
    sleep 5
    # Progress every ~30s so a watching human sees movement.
    if (((SECONDS - start) % 30 < 5)); then
        log "still installing ($((SECONDS - start))s elapsed): $(tail -1 "$STATE/install.log" 2>/dev/null)"
    fi
done

log "timed out after ${TIMEOUT}s; install may still be running"
log "check progress: tail -f $STATE/install.log"
exit 1
