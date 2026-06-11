#!/usr/bin/env bash
#
# CI shard entrypoint for browser benchmarks against a pre-built site.
#
# Starts a static file server for the given dist directory, runs the Playwright
# benchmark script against it, and cleans up the server on exit. No builds —
# the dist directory is expected to be a completed `nx build ag-charts-website`
# output (typically downloaded as a CI artifact).
#
# IMPORTANT: example pages bake absolute library-script URLs from
# PUBLIC_SITE_URL at build time, so --port must match the port the site was
# built for (e.g. built with PUBLIC_SITE_URL=http://localhost:4601 -> --port 4601).
#
# Usage:
#   ./tools/benchmark/serve-and-run.sh --dist <dist-dir> --output <results.json> [--port PORT] [-- extra args for browser-benchmark.ts]
#
# Examples:
#   ./tools/benchmark/serve-and-run.sh --dist dist/packages/ag-charts-website --output reports/browser-benchmarks/head.json
#   ./tools/benchmark/serve-and-run.sh --dist /tmp/site-base --output base.json -- --examples simple-chart,large-dataset

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIST_DIR=""
OUTPUT=""
PORT=4601  # must match the PUBLIC_SITE_URL port the dist was built with
SERVER_PID=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dist)
            DIST_DIR="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
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
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ -z "$DIST_DIR" || -z "$OUTPUT" ]]; then
    echo "Usage: serve-and-run.sh --dist <dist-dir> --output <results.json> [--port PORT] [-- <browser-benchmark.ts args>]" >&2
    exit 1
fi

cleanup() {
    if [[ -n "$SERVER_PID" ]]; then
        echo "Stopping static server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

server_log=$(mktemp -t serve-static.XXXXXX.log)

echo "Starting static server for ${DIST_DIR}..."
cd "$REPO_ROOT"
node tools/benchmark/serve-static.js --dir "$DIST_DIR" --port "$PORT" > "$server_log" 2>&1 &
SERVER_PID=$!

# Wait for the parseable readiness line and extract the URL
BASE_URL=""
for _ in $(seq 1 30); do
    BASE_URL=$(grep -oE '^SERVING http://[^ ]+' "$server_log" 2>/dev/null | head -1 | awk '{print $2}' || true)
    [[ -n "$BASE_URL" ]] && break
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "Static server exited unexpectedly:" >&2
        cat "$server_log" >&2
        exit 1
    fi
    sleep 1
done

if [[ -z "$BASE_URL" ]]; then
    echo "Static server did not report readiness:" >&2
    cat "$server_log" >&2
    exit 1
fi

echo "Static server ready at ${BASE_URL}. Running browser benchmarks..."
npx tsx tools/benchmark/browser-benchmark.ts \
    --base-url "$BASE_URL" \
    --output "$OUTPUT" \
    "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
