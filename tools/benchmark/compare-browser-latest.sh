#!/bin/bash
#
# CI orchestrator for browser benchmark comparison.
#
# Benchmarks the current (head) branch and a base branch, then compares results.
# Uses a git worktree for the base branch build so the head working tree stays clean.
# browser-benchmark.ts always runs from the head working directory (single Playwright install).
#
# Usage:
#   ./tools/benchmark/compare-browser-latest.sh [options] <base-ref>
#
# Options:
#   -j            Output JSON instead of table format
#
# Examples:
#   ./tools/benchmark/compare-browser-latest.sh origin/b13.2.0
#   ./tools/benchmark/compare-browser-latest.sh -j origin/latest

set -euo pipefail

export NX_DAEMON=false

# --- Argument parsing ---

format=table

while getopts "j" opt; do
    case $opt in
        j)
            format=json
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done
shift $((OPTIND - 1))

base_ref=${1:?Usage: compare-browser-latest.sh [-j] <base-ref>}

# --- Derived variables ---

root=$(git rev-parse --show-toplevel)
head=$(git rev-parse --short HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
tools_dir="${root}/tools/benchmark"
worktree_dir="/tmp/ag-charts-base-bench-$$"

HEAD_PORT=4601
BASE_PORT=4602
HEAD_SERVER_PID=""
BASE_SERVER_PID=""
WORKTREE_CREATED=false
BUILD_TIMEOUT=1800  # 30 minutes

# Reports directory
reports_dir="${root}/reports/browser-benchmarks"
mkdir -p "${reports_dir}"

head_results="${reports_dir}/head.json"
base_results="${reports_dir}/base.json"

# --- Logging helpers ---

logStarBox() {
    local message=$1
    local max_length=0

    while IFS= read -r line; do
        (( ${#line} > max_length )) && max_length=${#line}
    done <<< "$message"

    local border
    border=$(printf '%*s' "$((max_length + 8))" | tr ' ' '*')

    echo "$border" >&2
    while IFS= read -r line; do
        printf "*** %-${max_length}s ***\n" "$line" >&2
    done <<< "$message"
    echo "$border" >&2
}

log() {
    echo "[compare-browser] $*" >&2
}

logError() {
    echo "[compare-browser] ERROR: $*" >&2
}

# --- Dev server helpers ---

stop_dev_server() {
    local pid=$1
    local port=$2

    if [[ -n "$pid" ]]; then
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    fi
    pkill -f "astro dev --port=${port}" 2>/dev/null || true
}

# --- Soft-fail helper ---

# If AG_BENCHMARK_SOFT_FAIL is set, log the message and set base_results=""
# to skip remaining base benchmark steps. Otherwise, exit 1.
soft_fail_or_exit() {
    local message=$1
    logError "$message"
    if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" == "true" ]]; then
        log "Continuing in soft-fail mode..."
        base_results=""
    else
        cd "$root" 2>/dev/null || true
        exit 1
    fi
}

# --- Cleanup ---

cleanup() {
    log "Cleaning up..."
    stop_dev_server "$HEAD_SERVER_PID" "$HEAD_PORT"
    stop_dev_server "$BASE_SERVER_PID" "$BASE_PORT"

    if [[ "$WORKTREE_CREATED" == "true" ]]; then
        log "Removing worktree at ${worktree_dir}..."
        git worktree remove --force "${worktree_dir}" 2>/dev/null || rm -rf "${worktree_dir}"
    fi
}
trap cleanup EXIT INT TERM

# --- Kill stale servers ---

kill_port() {
    local port=$1
    local pid
    pid=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pid" ]]; then
        log "Killing stale process on port $port (PID $pid)"
        kill "$pid" 2>/dev/null || true
        sleep 1
    fi
}

# --- Start dev server ---

# Sets global _DEV_SERVER_PID. Do NOT call via command substitution $(...) —
# the subshell would block forever waiting for the background dev server.
_DEV_SERVER_PID=""
start_dev_server() {
    local port=$1
    local working_dir=$2

    log "Starting dev server on port $port from ${working_dir}..."
    cd "$working_dir"
    PUBLIC_SITE_URL="http://localhost:$port" PUBLIC_HTTPS_SERVER=false PORT="$port" npx nx dev ag-charts-website &
    _DEV_SERVER_PID=$!
    cd "$root"

    log "Waiting for dev server at http://localhost:$port..."
    npx wait-on "http-get://localhost:$port/charts/" --timeout 120000

    log "Dev server ready on port $port (PID $_DEV_SERVER_PID)"
}

# --- Run browser benchmarks ---

run_benchmarks() {
    local base_url=$1
    local output=$2

    log "Running browser benchmarks against ${base_url}..."
    cd "$root"

    # Always run from head working directory for consistent Playwright/tooling
    local exit_code=0
    npx tsx "${tools_dir}/browser-benchmark.ts" \
        --base-url "$base_url" \
        --output "$output" || exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" == "true" ]]; then
            log "Benchmark had failures (exit code $exit_code), continuing in soft-fail mode..."
        else
            return $exit_code
        fi
    fi

    log "Results written to ${output}"
}

# ===========================
# Main
# ===========================

logStarBox "Browser Benchmark Comparison
Head: ${branch} (${head})
Base: ${base_ref}"

# Ensure Playwright chromium is available
log "Ensuring Playwright Chromium is installed..."
npx playwright install chromium 2>/dev/null || log "Playwright install skipped (may already be present)"

# Kill any stale servers
kill_port $HEAD_PORT
kill_port $BASE_PORT

# --- HEAD BENCHMARKS ---

logStarBox "Phase 1: HEAD benchmarks (${branch})"

# Ensure examples are generated (dev server needs them for gallery/homepage)
log "Generating examples..."
npx nx generate-examples ag-charts-website 2>&1 || log "generate-examples failed (non-fatal, dev server may still work for benchmarks)"

start_dev_server $HEAD_PORT "$root"
HEAD_SERVER_PID=$_DEV_SERVER_PID
run_benchmarks "http://localhost:$HEAD_PORT/charts" "$head_results" || {
    if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
        logError "Head benchmarks failed"
        exit 1
    fi
}

log "Stopping head dev server..."
stop_dev_server "$HEAD_SERVER_PID" "$HEAD_PORT"
HEAD_SERVER_PID=""

# --- BASE BENCHMARKS (worktree) ---

logStarBox "Phase 2: BASE benchmarks (${base_ref})"

log "Creating worktree at ${worktree_dir} for ${base_ref}..."
git worktree add "${worktree_dir}" "${base_ref}" 2>&1 || {
    soft_fail_or_exit "Failed to create worktree for ${base_ref}"
}

if [[ -d "${worktree_dir}" ]]; then
    WORKTREE_CREATED=true

    # Share Nx cache between host and worktree
    export NX_CACHE_DIRECTORY="${root}/.nx/cache"

    # Use timeout for build steps (macOS may need coreutils gtimeout)
    TIMEOUT_CMD=()
    if command -v timeout &>/dev/null; then
        TIMEOUT_CMD=(timeout "$BUILD_TIMEOUT")
    elif command -v gtimeout &>/dev/null; then
        TIMEOUT_CMD=(gtimeout "$BUILD_TIMEOUT")
    fi

    # Install dependencies in worktree
    log "Installing dependencies in worktree..."
    cd "${worktree_dir}"
    log "Trying immutable install..."
    yarn install --immutable 2>/dev/null || yarn install || {
        soft_fail_or_exit "Failed to install dependencies in worktree"
    }

    if [[ -n "$base_results" ]]; then
        # Build the website in the worktree
        log "Building ag-charts-website in worktree (timeout: ${BUILD_TIMEOUT}s)..."
        cd "${worktree_dir}"
        ${TIMEOUT_CMD[@]+"${TIMEOUT_CMD[@]}"} npx nx build ag-charts-website 2>&1 || {
            soft_fail_or_exit "Failed to build website in worktree"
        }
        cd "$root"
    fi

    if [[ -n "$base_results" ]]; then
        kill_port $BASE_PORT
        start_dev_server $BASE_PORT "${worktree_dir}"
        BASE_SERVER_PID=$_DEV_SERVER_PID

        run_benchmarks "http://localhost:$BASE_PORT/charts" "$base_results" || {
            if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
                logError "Base benchmarks failed"
                exit 1
            fi
        }

        log "Stopping base dev server..."
        stop_dev_server "$BASE_SERVER_PID" "$BASE_PORT"
        BASE_SERVER_PID=""
    fi

    # Clean up worktree early
    log "Removing worktree..."
    cd "$root"
    git worktree remove --force "${worktree_dir}" 2>/dev/null || rm -rf "${worktree_dir}"
    WORKTREE_CREATED=false
fi

# --- COMPARE ---

logStarBox "Phase 3: Comparing results"

# Determine output file
if [[ "$format" == "json" ]]; then
    output="${root}/reports/browser-benchmark.json"
else
    output="${root}/reports/browser-benchmark.log"
fi

if [[ -z "$base_results" || ! -f "$base_results" ]]; then
    log "Base benchmark results unavailable, writing partial report..."
    if [[ "$format" == "json" ]]; then
        cat > "$output" <<ENDJSON
{"base":"${base_ref#origin/}","compare":"${branch}","rankedByTime":[],"added":[],"removed":[],"errors":["Base benchmark results unavailable for ${base_ref}"]}
ENDJSON
    else
        echo "Base benchmark results unavailable for ${base_ref}" > "$output"
        echo "Only head results available at ${head_results}" >> "$output"
    fi
    cat "$output"
    exit 0
fi

# Strip 'origin/' prefix for display labels
base_label="${base_ref#origin/}"
compare_label="${branch}"

node "${tools_dir}/compare-browser-results.js" \
    --base "$base_results" \
    --compare "$head_results" \
    --base-label "$base_label" \
    --compare-label "$compare_label" \
    --format "$format" \
    --report-only \
    > "$output"

cat "$output"
log "Comparison results saved to ${output}"
