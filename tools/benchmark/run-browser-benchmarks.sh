#!/usr/bin/env bash
#
# CI wrapper for browser-based benchmarks.
# Starts the Astro dev server, waits for it, runs the Playwright benchmark script,
# and cleans up the server on exit.
#
# Usage:
#   ./tools/benchmark/run-browser-benchmarks.sh [--port PORT] [-- extra args for browser-benchmark.ts]
#
# Examples:
#   ./tools/benchmark/run-browser-benchmarks.sh
#   ./tools/benchmark/run-browser-benchmarks.sh --port 4602
#   ./tools/benchmark/run-browser-benchmarks.sh -- --examples simple-chart --timeout 60000

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${PORT:-4601}"
SERVER_PID=""
EXTRA_ARGS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            PORT="$2"
            shift 2
            ;;
        --)
            shift
            EXTRA_ARGS=("$@")
            break
            ;;
        *)
            EXTRA_ARGS+=("$1")
            shift
            ;;
    esac
done

cleanup() {
    if [[ -n "$SERVER_PID" ]]; then
        echo "Stopping dev server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    # Kill any orphaned Astro child process (Nx wraps the actual server)
    pkill -f "astro dev --port=${PORT}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting dev server on port $PORT..."
cd "$REPO_ROOT"
PORT="$PORT" npx nx dev ag-charts-website &
SERVER_PID=$!

echo "Waiting for dev server at http://localhost:$PORT..."
npx wait-on "http-get://localhost:$PORT/charts/" --timeout 120000

echo "Dev server ready. Running browser benchmarks..."
npx tsx tools/benchmark/browser-benchmark.ts \
    --base-url "http://localhost:$PORT/charts" \
    "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
