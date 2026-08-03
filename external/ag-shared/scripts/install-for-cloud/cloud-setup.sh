#!/usr/bin/env bash
# external/ag-shared/scripts/install-for-cloud/cloud-setup.sh
#
# Setup script for Claude Code cloud sessions (claude.ai/code, `claude --cloud`,
# routines, Claude Tag). It is NOT wired up by the repo: paste the bootstrap
# snippet from external/ag-shared/docs/claude-code-cloud-sessions.md into the
# "Setup script" field of the cloud environment, and it will locate and run this
# file from the clone.
#
# Execution contract (Anthropic-defined, see the doc for citations):
#   - runs as root on Ubuntu 24.04, BEFORE Claude Code launches
#   - runs once per environment; the resulting filesystem is snapshotted and
#     reused by later sessions, which skip this script entirely
#   - MUST exit 0 — a non-zero exit fails session creation
#   - MUST finish within roughly 5 minutes or the snapshot is not built
#
# Every step is therefore best-effort: failures are logged and the script keeps
# going. What it does:
#   1. pins node to .nvmrc and installs yarn@1 + nx globally
#   2. runs a full `yarn install` (postinstall renders .claude/ and the rulesync
#      outputs, so Claude Code sees skills/rules/plugins when it launches)
#   3. seeds $AG_CLOUD_CACHE_DIR with node_modules and the resolved node path, so
#      per-session SessionStart can restore in seconds if the repo is re-cloned
#   4. pre-clones the plugin marketplaces so plugin install at launch is local
#
# Per-session work lives in install-for-cloud.sh (the SessionStart hook).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${AG_CLOUD_REPO_ROOT:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"
AG_CLOUD_CACHE_DIR="${AG_CLOUD_CACHE_DIR:-$HOME/.cache/ag-cloud}"

# Deadline for the whole script, kept under the ~5 minute cap with headroom for
# the snapshot itself. Individual long steps get their own `timeout`.
TOTAL_BUDGET_SECONDS="${AG_CLOUD_SETUP_BUDGET:-270}"
START_TS=$SECONDS

export AG_SKIP_NATIVE_DEP_VERSION_CHECK=1
export PUPPETEER_SKIP_DOWNLOAD=true
export NX_DAEMON=false
export CI=

log_info() { echo "[cloud-setup] $*"; }
log_warn() { echo "[cloud-setup] WARN: $*" >&2; }

elapsed() { echo $((SECONDS - START_TS)); }
remaining() { echo $((TOTAL_BUDGET_SECONDS - $(elapsed))); }

# with_timeout <seconds> <command...> — bounded run where coreutils `timeout`
# exists (it does on the cloud image), plain run where it does not, so the script
# stays usable on a developer machine.
with_timeout() {
    local seconds="$1"
    shift
    if command -v timeout &>/dev/null; then
        timeout "${seconds}s" "$@"
    else
        "$@"
    fi
}

# sha256_of <file> — coreutils on the cloud image, BSD tooling on a developer Mac.
sha256_of() {
    if command -v sha256sum &>/dev/null; then
        sha256sum "$1" | awk '{print $1}'
    else
        shasum -a 256 "$1" | awk '{print $1}'
    fi
}

# step <label> <command...> — time a step, log the outcome, never abort.
step() {
    local label="$1"
    shift
    local start=$SECONDS
    if "$@"; then
        log_info "✓ ${label} ($((SECONDS - start))s)"
        return 0
    fi
    log_warn "✗ ${label} failed after $((SECONDS - start))s — continuing"
    return 1
}

# ---------------------------------------------------------------------------
# node / yarn / nx
# ---------------------------------------------------------------------------

load_nvm() {
    local dir
    for dir in "${NVM_DIR:-}" "$HOME/.nvm" /usr/local/nvm /usr/local/share/nvm /opt/nvm; do
        [[ -n "$dir" && -s "$dir/nvm.sh" ]] || continue
        # shellcheck disable=SC1091
        . "$dir/nvm.sh" && return 0
    done
    return 1
}

pin_node() {
    local wanted=""
    [[ -f "$REPO_ROOT/.nvmrc" ]] && wanted="$(tr -d 'v \t\n' <"$REPO_ROOT/.nvmrc")"
    if [[ -z "$wanted" ]]; then
        log_warn "no .nvmrc at $REPO_ROOT, keeping preinstalled node $(node -v 2>/dev/null || echo '?')"
        return 0
    fi

    if [[ "$(node -v 2>/dev/null)" == "v${wanted}" ]]; then
        log_info "node v${wanted} already active"
        record_node_path
        return 0
    fi

    if ! load_nvm; then
        log_warn "nvm not found; wanted node v${wanted}, have $(node -v 2>/dev/null || echo 'none')"
        return 0
    fi

    # `nvm install` fetches from nodejs.org, which is on the default Trusted
    # allowlist. Fall back to the closest installed major if it is unreachable.
    if nvm install "$wanted" >/dev/null 2>&1; then
        nvm alias default "$wanted" >/dev/null 2>&1 || true
        nvm use "$wanted" >/dev/null 2>&1 || true
        log_info "node pinned to $(node -v)"
    else
        log_warn "nvm install ${wanted} failed; using $(node -v 2>/dev/null || echo 'none')"
        nvm use --lts >/dev/null 2>&1 || true
    fi
    record_node_path
}

# Persist the node bin directory for the session. The setup script's own
# environment does not carry over to the session, so install-for-cloud.sh reads
# this file at SessionStart and puts it on PATH via $CLAUDE_ENV_FILE.
record_node_path() {
    local bin
    bin="$(dirname "$(command -v node 2>/dev/null || true)")" || return 0
    [[ -d "$bin" ]] || return 0
    mkdir -p "$AG_CLOUD_CACHE_DIR"
    printf '%s\n' "$bin" >"$AG_CLOUD_CACHE_DIR/node-bin-path"
}

install_yarn_and_nx() {
    if ! command -v yarn &>/dev/null; then
        npm i -g --force yarn@1 >/dev/null 2>&1 || {
            log_warn "yarn@1 global install failed"
            return 1
        }
    fi

    # Engine checks are noisy in cloud images; the repo pins node itself. Only
    # written when absent — repos that track .yarnrc keep their own copy.
    if [[ ! -f "$REPO_ROOT/.yarnrc" ]]; then
        cat >"$REPO_ROOT/.yarnrc" <<'EOF'
--install.ignore-engines true
--run.ignore-engines true
EOF
    fi

    if ! command -v nx &>/dev/null; then
        local nx_version
        nx_version="$(node -p "require('$REPO_ROOT/package.json').devDependencies.nx" 2>/dev/null)"
        if [[ -n "$nx_version" && "$nx_version" != "undefined" ]]; then
            yarn global add "nx@${nx_version}" >/dev/null 2>&1 ||
                log_warn "nx@${nx_version} global install failed (yarn nx still works)"
        fi
    fi
    log_info "node $(node -v 2>/dev/null), yarn $(yarn -v 2>/dev/null), nx $(nx --version 2>/dev/null | tail -1)"
}

# ---------------------------------------------------------------------------
# dependencies
# ---------------------------------------------------------------------------

install_dependencies() {
    cd "$REPO_ROOT" || return 1

    local budget
    budget="$(remaining)"
    ((budget > 30)) || {
        log_warn "no time left for yarn install (budget ${TOTAL_BUDGET_SECONDS}s exhausted)"
        return 1
    }

    # A full install of this monorepo takes ~9 minutes on a cloud VM (measured:
    # 534s), which does not fit in Anthropic's ~5 minute setup-script cap — an
    # earlier revision simply burned its whole budget and seeded nothing. So skip
    # the postinstall chain here (`--ignore-scripts`, plus AG_SKIP_PLUGIN_BUILD for
    # any script that slips through): resolving, fetching and linking is the slow,
    # cacheable part, while allow-scripts, patch-package and the nx plugin build
    # are comparatively quick and get done by the session's own install.
    #
    # What lands in the snapshot is therefore a complete-but-unscripted
    # node_modules plus a warm ~/.cache/yarn. The SessionStart hook then runs a
    # real `yarn install --prefer-offline` in the background, which applies
    # patches and runs scripts against already-linked packages.
    export AG_SKIP_PLUGIN_BUILD=1

    log_info "yarn install --prefer-offline --ignore-scripts (budget ${budget}s)"
    with_timeout "$budget" yarn install --prefer-offline --ignore-scripts
    local rc=$?
    if ((rc == 124)); then
        log_warn "yarn install hit the ${budget}s budget"
        # Seed whatever landed: a partial tree still leaves the yarn cache warm,
        # and the session's install completes it far faster than from cold.
        return 1
    fi
    return "$rc"
}

# Seed a cache outside the repo so a re-cloned working tree can be made ready
# without a full install. Hardlinks keep this cheap on the same filesystem.
seed_node_modules_cache() {
    [[ -d "$REPO_ROOT/node_modules" ]] || return 1

    mkdir -p "$AG_CLOUD_CACHE_DIR"
    local dest="$AG_CLOUD_CACHE_DIR/node_modules"
    local staging="${dest}.staging.$$"

    rm -rf "$staging"
    if ! cp -al "$REPO_ROOT/node_modules" "$staging" 2>/dev/null; then
        rm -rf "$staging"
        cp -a "$REPO_ROOT/node_modules" "$staging" 2>/dev/null || {
            rm -rf "$staging"
            return 1
        }
    fi
    rm -rf "$dest"
    mv "$staging" "$dest"

    # Key the cache to the lockfile so a branch with different dependencies
    # falls back to a real install instead of restoring a stale tree.
    if [[ -f "$REPO_ROOT/yarn.lock" ]]; then
        sha256_of "$REPO_ROOT/yarn.lock" >"$AG_CLOUD_CACHE_DIR/yarn.lock.sha256"
    fi

    # The tree was built with --ignore-scripts, so patch-package has not run and
    # the plugins are unbuilt — yet `yarn check --integrity` still passes on it.
    # Without this marker the SessionStart hook would take its fast path and call
    # the session ready with patches unapplied. The hook uses it to force a
    # background install that scripts the tree, and clears it once that succeeds.
    : >"$AG_CLOUD_CACHE_DIR/unscripted"
    log_info "cached node_modules at ${dest} ($(du -sh "$dest" 2>/dev/null | awk '{print $1}'))"
}

# ---------------------------------------------------------------------------
# plugin marketplaces
# ---------------------------------------------------------------------------
#
# Claude Code installs the marketplaces declared in .claude/settings.json when it
# launches. Pre-cloning them here moves that network round-trip into the cached
# snapshot, and surfaces reachability problems in the setup log rather than as
# missing skills mid-session. ag-grid/ag-dev-prompts is a private repository, so
# a failure here is the signal that the session's GitHub credentials do not cover
# repositories other than the attached one.

clone_marketplace() {
    local name="$1" repo="$2" ref="${3:-}"
    local dest="$HOME/.claude/plugins/marketplaces/$name"

    if [[ -d "$dest/.git" ]]; then
        with_timeout 60 git -C "$dest" fetch --depth 1 origin "${ref:-HEAD}" >/dev/null 2>&1 || true
        log_info "marketplace ${name} already cloned"
        return 0
    fi

    mkdir -p "$(dirname "$dest")"
    local args=(clone --depth 1)
    [[ -n "$ref" ]] && args+=(--branch "$ref")
    # Plain HTTPS first: in a cloud session the GitHub proxy substitutes real
    # credentials. Then an explicit token, for environments that set one. Then SSH,
    # which is what a developer machine running this by hand will have.
    local url
    for url in "https://github.com/${repo}.git" \
        "${GH_TOKEN:+https://x-access-token:${GH_TOKEN}@github.com/${repo}.git}" \
        "git@github.com:${repo}.git"; do
        [[ -n "$url" ]] || continue
        [[ "$url" == *"proxy-injected"* ]] && continue
        if with_timeout 60 git "${args[@]}" "$url" "$dest" >/dev/null 2>&1; then
            log_info "cloned marketplace ${name} (${repo}${ref:+#$ref})"
            return 0
        fi
        rm -rf "$dest"
    done
    log_warn "could not clone ${repo} — Claude Code will retry at launch; if it also fails, skills from this marketplace will be missing"
    return 1
}

seed_marketplaces() {
    local ref="${AG_DEV_PROMPTS_REF:-canary}"
    clone_marketplace ag-dev ag-grid/ag-dev-prompts "$ref" || true
    clone_marketplace openai-codex openai/codex-plugin-cc || true
    return 0
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

main() {
    log_info "repo root: ${REPO_ROOT}"
    if [[ ! -f "$REPO_ROOT/package.json" ]]; then
        log_warn "no package.json at ${REPO_ROOT}; nothing to set up"
        exit 0
    fi

    step "pin node" pin_node
    # Recorded unconditionally: whatever node the session should use, including
    # the preinstalled one when pinning was skipped or failed.
    record_node_path
    step "install yarn + nx" install_yarn_and_nx

    # Marketplaces first: they are seconds of work, and an earlier revision let a
    # budget-hogging install starve them.
    step "seed plugin marketplaces" seed_marketplaces

    # Seed whatever the install produced, complete or not — a partial tree plus a
    # warm yarn cache still beats starting the session from cold.
    step "yarn install" install_dependencies || true
    if [[ -d "$REPO_ROOT/node_modules" ]]; then
        step "seed node_modules cache" seed_node_modules_cache
    else
        log_warn "no node_modules to cache; sessions will install from the yarn cache"
    fi

    # Report what a session will actually find, so the setup log is diagnostic.
    if [[ -f "$REPO_ROOT/.claude/settings.json" ]]; then
        log_info "✓ .claude/settings.json present (hooks + plugins will load)"
    else
        log_warn ".claude/settings.json missing — sessions will start without hooks or plugins"
    fi

    log_info "done in $(elapsed)s"
    # Always succeed: a non-zero exit here fails session creation outright.
    exit 0
}

main
