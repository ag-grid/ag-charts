#!/bin/bash
#
# CI orchestrator for browser benchmark comparison.
#
# Benchmarks the current (head) branch and a base branch, then compares results.
# Both refs are built statically (nx build ag-charts-website) and served via the
# zero-dep static server, so no Astro dev server is needed. Uses a git worktree
# for the base branch build so the head working tree stays clean.
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
#   ./tools/benchmark/compare-browser-latest.sh origin/latest -- --examples data-selection-zoom --test-cases line

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

base_ref=${1:?Usage: compare-browser-latest.sh [-j] <base-ref> [-- <browser-benchmark.ts args>]}
shift

# Anything after a `--` separator is forwarded verbatim to browser-benchmark.ts on both
# the head and base runs (e.g. --examples data-selection-zoom --test-cases line).
benchmark_args=()
if [[ $# -gt 0 ]]; then
    if [[ "$1" == "--" ]]; then
        shift
        benchmark_args=("$@")
    else
        echo "Unexpected extra arguments: $*" >&2
        echo "Use '--' to separate forwarded browser-benchmark.ts args." >&2
        exit 1
    fi
fi

# --- Derived variables ---

root=$(git rev-parse --show-toplevel)
head=$(git rev-parse --short HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
tools_dir="${root}/tools/benchmark"
worktree_dir="/tmp/ag-charts-base-bench-$$"

# Example pages bake absolute library-script URLs from PUBLIC_SITE_URL at build
# time, so each ref must be built for the exact origin it will be served from.
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

# --- Static server helpers ---

stop_static_server() {
    local pid=$1

    if [[ -n "$pid" ]]; then
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    fi
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
    stop_static_server "$HEAD_SERVER_PID"
    stop_static_server "$BASE_SERVER_PID"

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

# --- Start static server ---

# Sets globals: _STATIC_SERVER_PID, _STATIC_SERVER_URL.
# Do NOT call via command substitution $(...) — the subshell would block
# forever waiting for the background server.
_STATIC_SERVER_PID=""
_STATIC_SERVER_URL=""
start_static_server() {
    local dist_dir=$1
    local label=$2
    local port=$3

    local server_log="${reports_dir}/static-server-${label}.log"

    kill_port "$port"
    log "Starting static server for ${dist_dir} on port ${port}..."
    node "${tools_dir}/serve-static.js" --dir "$dist_dir" --port "$port" > "$server_log" 2>&1 &
    _STATIC_SERVER_PID=$!

    # Wait for the parseable readiness line
    local actual_url=""
    for i in $(seq 1 30); do
        actual_url=$(grep -oE '^SERVING http://[^ ]+' "$server_log" 2>/dev/null | head -1 | awk '{print $2}' || true)
        if [[ -n "$actual_url" ]]; then
            break
        fi
        if ! kill -0 "$_STATIC_SERVER_PID" 2>/dev/null; then
            logError "Static server exited unexpectedly:"
            cat "$server_log" >&2
            return 1
        fi
        sleep 1
    done

    if [[ -z "$actual_url" ]]; then
        logError "Static server did not report readiness:"
        cat "$server_log" >&2
        return 1
    fi

    _STATIC_SERVER_URL="$actual_url"
    log "Static server ready at $_STATIC_SERVER_URL (PID $_STATIC_SERVER_PID)"
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
        --output "$output" \
        "${benchmark_args[@]+"${benchmark_args[@]}"}" || exit_code=$?

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

# Prefer the benchmark-only build target (skips non-benchmark pages and
# thumbnails); refs that predate it fall back to the full site build.
website_build_target() {
    if npx nx show project ag-charts-website 2>/dev/null | grep -q '"build:benchmarks"'; then
        echo 'build:benchmarks'
    else
        echo 'build'
    fi
}

# Use timeout for build steps (macOS may need coreutils gtimeout)
TIMEOUT_CMD=()
if command -v timeout &>/dev/null; then
    TIMEOUT_CMD=(timeout "$BUILD_TIMEOUT")
elif command -v gtimeout &>/dev/null; then
    TIMEOUT_CMD=(gtimeout "$BUILD_TIMEOUT")
fi

# --- HEAD BENCHMARKS ---

logStarBox "Phase 1: HEAD benchmarks (${branch})"

log "Building ag-charts-website (timeout: ${BUILD_TIMEOUT}s)..."
PUBLIC_SITE_URL="http://localhost:${HEAD_PORT}" PUBLIC_HTTPS_SERVER=false \
    ${TIMEOUT_CMD[@]+"${TIMEOUT_CMD[@]}"} npx nx "$(website_build_target)" ag-charts-website 2>&1 || {
    logError "Failed to build website for HEAD"
    exit 1
}

start_static_server "${root}/dist/packages/ag-charts-website" head "$HEAD_PORT"
HEAD_SERVER_PID=$_STATIC_SERVER_PID
HEAD_URL=$_STATIC_SERVER_URL
run_benchmarks "$HEAD_URL" "$head_results" || {
    if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
        logError "Head benchmarks failed"
        exit 1
    fi
}

log "Stopping head static server..."
stop_static_server "$HEAD_SERVER_PID"
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

    # COW-clone node_modules from HEAD to avoid a full install.
    # On APFS (macOS) cp -cR is near-instant; falls back to rsync on other FS.
    # Even if yarn.lock differs, starting from a populated node_modules means
    # yarn only reconciles the delta rather than resolving/fetching everything.
    log "COW-cloning node_modules from HEAD..."
    if cp -cR "${root}/node_modules/" "${worktree_dir}/node_modules/" 2>/dev/null || \
       rsync -a --quiet "${root}/node_modules/" "${worktree_dir}/node_modules/" 2>/dev/null; then
        # Also clone nested workspace node_modules (Yarn 1 nohoist)
        while IFS= read -r nested; do
            rel_path="${nested#${root}/}"
            if [[ ! -d "${worktree_dir}/${rel_path}" ]]; then
                mkdir -p "$(dirname "${worktree_dir}/${rel_path}")"
                cp -cR "${nested}/" "${worktree_dir}/${rel_path}/" 2>/dev/null || true
            fi
        done < <(find "${root}" -name "node_modules" -type d \
            -not -path "${root}/node_modules/*" \
            -not -path "${root}/node_modules" \
            -maxdepth 3 2>/dev/null)
        log "COW clone complete"
    else
        log "COW clone failed, falling back to full install"
    fi

    # Install/reconcile dependencies
    cd "${worktree_dir}"
    if diff -q "${root}/yarn.lock" "${worktree_dir}/yarn.lock" &>/dev/null; then
        log "yarn.lock matches HEAD, skipping install"
    else
        log "yarn.lock differs, reconciling dependencies..."
        yarn install --prefer-offline || yarn install || {
            soft_fail_or_exit "Failed to install dependencies in worktree"
        }
    fi

    if [[ -n "$base_results" ]]; then
        # Build the website in the worktree
        log "Building ag-charts-website in worktree (timeout: ${BUILD_TIMEOUT}s)..."
        cd "${worktree_dir}"
        PUBLIC_SITE_URL="http://localhost:${BASE_PORT}" PUBLIC_HTTPS_SERVER=false \
            ${TIMEOUT_CMD[@]+"${TIMEOUT_CMD[@]}"} npx nx "$(website_build_target)" ag-charts-website 2>&1 || {
            soft_fail_or_exit "Failed to build website in worktree"
        }
        cd "$root"
    fi

    if [[ -n "$base_results" ]]; then
        start_static_server "${worktree_dir}/dist/packages/ag-charts-website" base "$BASE_PORT" || {
            soft_fail_or_exit "Failed to start static server for base"
        }
        if [[ -n "$base_results" ]]; then
            BASE_SERVER_PID=$_STATIC_SERVER_PID
            BASE_URL=$_STATIC_SERVER_URL

            run_benchmarks "$BASE_URL" "$base_results" || {
                if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
                    logError "Base benchmarks failed"
                    exit 1
                fi
            }

            log "Stopping base static server..."
            stop_static_server "$BASE_SERVER_PID"
            BASE_SERVER_PID=""
        fi
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
