#!/bin/bash
#
# CI orchestrator for browser benchmark comparison.
#
# Benchmarks the current (head) branch and a base, then compares results.
#
# The base is either:
#   - a git ref (e.g. origin/b13.2.0): built statically in a worktree, so the
#     base ref's own example set runs against the base library; or
#   - a published npm version (npm:<version>, e.g. npm:13.3.1): the head-built
#     site is copied and its dev-served library bundles are replaced with the
#     published UMD bundles, so the HEAD example set runs against the published
#     library — no base build needed. Test cases using APIs the published
#     version lacks rely on the examples' own version guards.
#
# browser-benchmark.ts always runs from the head working directory (single Playwright install).
#
# For npm:<version> bases, head is served from its own locally-packed UMD (swap-local-lib.sh)
# so head and base are each a packed-tarball bundle through the same pipeline — like-for-like.
# Without this, a locally-built head bundle vs a release-packed published bundle differ by a
# build-asymmetry offset that inflates head's apparent cost.
#
# Usage:
#   ./tools/benchmark/compare-browser-latest.sh [options] <base-ref|npm:version>
#
# Options:
#   -j            Output JSON instead of table format
#   -n <N>        Run the benchmark N times per side and aggregate (median of run medians;
#                 cross-run variance gates noise). Default 1. Use >=3 to see past the noise floor.
#
# Examples:
#   ./tools/benchmark/compare-browser-latest.sh origin/b13.2.0
#   ./tools/benchmark/compare-browser-latest.sh npm:13.3.1
#   ./tools/benchmark/compare-browser-latest.sh -n 3 npm:13.3.1
#   ./tools/benchmark/compare-browser-latest.sh -j origin/latest
#   ./tools/benchmark/compare-browser-latest.sh origin/latest -- --examples data-selection-zoom-line-area --test-cases line

set -euo pipefail

export NX_DAEMON=false

# --- Argument parsing ---

format=table
runs=1

while getopts "jn:" opt; do
    case $opt in
        j)
            format=json
            ;;
        n)
            runs=$OPTARG
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done
shift $((OPTIND - 1))

if ! [[ "$runs" =~ ^[1-9][0-9]*$ ]]; then
    echo "Invalid -n (runs) value: '$runs' — must be a positive integer" >&2
    exit 1
fi

base_ref=${1:?Usage: compare-browser-latest.sh [-j] <base-ref|npm:version> [-- <browser-benchmark.ts args>]}
shift

# npm:<version> selects published-library mode (head site + published bundles).
published_version=""
if [[ "$base_ref" == npm:* ]]; then
    published_version="${base_ref#npm:}"
fi

# Anything after a `--` separator is forwarded verbatim to browser-benchmark.ts on both
# the head and base runs (e.g. --examples data-selection-zoom-line-area --test-cases line).
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
BASE_SITE_DIR=""
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

    if [[ -n "$BASE_SITE_DIR" ]]; then
        rm -rf "$BASE_SITE_DIR"
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

# Run the benchmark `runs` times against one served site, writing <prefix>-run-<i>.json.
# Produced paths are returned in the global RUN_FILES array (bash 3.2 has no namerefs,
# so the caller copies RUN_FILES into its own array after each call).
RUN_FILES=()
run_benchmarks_n() {
    local base_url=$1
    local prefix=$2

    RUN_FILES=()
    local i out
    for ((i = 1; i <= runs; i++)); do
        out="${prefix}-run-${i}.json"
        if (( runs > 1 )); then
            log "Run ${i}/${runs}..."
        fi
        run_benchmarks "$base_url" "$out" || {
            if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
                return 1
            fi
        }
        [[ -f "$out" ]] && RUN_FILES+=("$out")
    done
}

head_run_files=()
base_run_files=()

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

# npm-base mode: serve head from its own locally-packed UMD so head and the published
# base are each a packed-tarball bundle (like-for-like). git-ref bases are built from
# source by the same local pipeline, so no swap is needed — they are already like-for-like.
if [[ -n "$published_version" ]]; then
    log "Packing local head bundles for like-for-like comparison..."
    "${tools_dir}/swap-local-lib.sh" "${root}/dist/packages/ag-charts-website" || {
        logError "Failed to pack local head bundles"
        exit 1
    }
fi

start_static_server "${root}/dist/packages/ag-charts-website" head "$HEAD_PORT"
HEAD_SERVER_PID=$_STATIC_SERVER_PID
HEAD_URL=$_STATIC_SERVER_URL
run_benchmarks_n "$HEAD_URL" "${reports_dir}/head" || {
    if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
        logError "Head benchmarks failed"
        exit 1
    fi
}
head_run_files=("${RUN_FILES[@]+"${RUN_FILES[@]}"}")
# Keep head.json (= first run) for consumers that read the single-run path.
[[ ${#head_run_files[@]} -gt 0 ]] && cp "${head_run_files[0]}" "$head_results"

log "Stopping head static server..."
stop_static_server "$HEAD_SERVER_PID"
HEAD_SERVER_PID=""

# --- BASE BENCHMARKS ---

logStarBox "Phase 2: BASE benchmarks (${base_ref})"

if [[ -n "$published_version" ]]; then
    # Published-library mode: reuse the head-built site with the dev-served
    # bundles replaced by the published UMD bundles. Pages bake absolute
    # library URLs for HEAD_PORT, so the copy is served on the same port
    # (the head server has already been stopped).
    BASE_SITE_DIR="/tmp/ag-charts-base-site-$$"
    log "Copying head site dist to ${BASE_SITE_DIR}..."
    cp -cR "${root}/dist/packages/ag-charts-website" "$BASE_SITE_DIR" 2>/dev/null || \
        cp -R "${root}/dist/packages/ag-charts-website" "$BASE_SITE_DIR" || {
        soft_fail_or_exit "Failed to copy head site dist"
    }

    if [[ -n "$base_results" ]]; then
        "${tools_dir}/swap-published-lib.sh" "$published_version" "$BASE_SITE_DIR" || {
            soft_fail_or_exit "Failed to fetch published v${published_version} bundles"
        }
    fi

    if [[ -n "$base_results" ]]; then
        start_static_server "$BASE_SITE_DIR" base "$HEAD_PORT" || {
            soft_fail_or_exit "Failed to start static server for base"
        }
    fi

    if [[ -n "$base_results" ]]; then
        BASE_SERVER_PID=$_STATIC_SERVER_PID
        BASE_URL=$_STATIC_SERVER_URL

        run_benchmarks_n "$BASE_URL" "${reports_dir}/base" || {
            if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
                logError "Base benchmarks failed"
                exit 1
            fi
        }
        base_run_files=("${RUN_FILES[@]+"${RUN_FILES[@]}"}")
        [[ ${#base_run_files[@]} -gt 0 ]] && cp "${base_run_files[0]}" "$base_results"

        log "Stopping base static server..."
        stop_static_server "$BASE_SERVER_PID"
        BASE_SERVER_PID=""
    fi

    rm -rf "$BASE_SITE_DIR"
    BASE_SITE_DIR=""
else

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

            run_benchmarks_n "$BASE_URL" "${reports_dir}/base" || {
                if [[ "${AG_BENCHMARK_SOFT_FAIL:-}" != "true" ]]; then
                    logError "Base benchmarks failed"
                    exit 1
                fi
            }
            base_run_files=("${RUN_FILES[@]+"${RUN_FILES[@]}"}")
            [[ ${#base_run_files[@]} -gt 0 ]] && cp "${base_run_files[0]}" "$base_results"

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

fi # end of git-ref vs published-library base mode

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

# In published mode the base version is the npm version we swapped in; in git-ref mode
# leave it unset so compare-browser-results.js derives it from the base report.
base_version_args=()
if [[ -n "$published_version" ]]; then
    base_version_args=(--base-version "$published_version")
fi

# Pass every per-run file so the reporter aggregates across runs. Fall back to the
# single-run paths when run files are unavailable (e.g. soft-fail partial results).
base_file_args=()
for f in "${base_run_files[@]+"${base_run_files[@]}"}"; do base_file_args+=(--base "$f"); done
[[ ${#base_file_args[@]} -eq 0 ]] && base_file_args=(--base "$base_results")
compare_file_args=()
for f in "${head_run_files[@]+"${head_run_files[@]}"}"; do compare_file_args+=(--compare "$f"); done
[[ ${#compare_file_args[@]} -eq 0 ]] && compare_file_args=(--compare "$head_results")

node "${tools_dir}/compare-browser-results.js" \
    "${base_file_args[@]}" \
    "${compare_file_args[@]}" \
    --base-label "$base_label" \
    --compare-label "$compare_label" \
    "${base_version_args[@]+"${base_version_args[@]}"}" \
    --format "$format" \
    --report-only \
    > "$output"

cat "$output"
log "Comparison results saved to ${output}"
