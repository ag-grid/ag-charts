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
#   2. registers the plugin marketplaces and installs the declared plugins, which
#      only works here: Claude Code enumerates plugin skills at launch, so a
#      marketplace registered mid-session installs files that nothing surfaces
#   3. runs `yarn install --ignore-scripts` (the slow, cacheable part)
#   4. seeds $AG_CLOUD_CACHE_DIR with node_modules and the resolved node path, so
#      per-session SessionStart can restore in seconds if the repo is re-cloned
#
# Per-session work lives in install-for-cloud.sh (the SessionStart hook).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${AG_CLOUD_REPO_ROOT:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"

# NOT under $HOME. This script runs as root, so $HOME is /root, while the session
# that later reads the cache runs as another user with its own home (/home/user in
# a cloud session) — an earlier revision seeded /root/.cache/ag-cloud, which no
# session could ever see, and every session then installed from cold while the
# cache sat there unused. Use one fixed, world-writable path both sides agree on.
AG_CLOUD_CACHE_DIR="${AG_CLOUD_CACHE_DIR:-/opt/ag-cloud}"

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
        log_warn "yarn install hit the ${budget}s budget — the tree is incomplete and will not be cached"
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
    # the session ready with patches unapplied. The hook uses it to tell the
    # session to run finish-setup.sh, which scripts the tree, refreshes this cache
    # and clears the marker for every later session.
    : >"$AG_CLOUD_CACHE_DIR/unscripted"
    log_info "cached node_modules at ${dest} ($(du -sh "$dest" 2>/dev/null | awk '{print $1}'))"
}

# ---------------------------------------------------------------------------
# plugin marketplaces and skills
# ---------------------------------------------------------------------------
#
# This is the only place plugin skills can be made to work, and it took three
# failed cloud sessions to establish why:
#
#   - A marketplace is only live when it is *registered* in
#     ~/.claude/plugins/known_marketplaces.json and its plugins appear in
#     installed_plugins.json. A bare git clone under plugins/marketplaces/ is
#     inert: an earlier revision cloned openai-codex successfully and the session
#     still reported it missing, because nothing registered it.
#   - Claude Code enumerates plugin skills once, at launch. Registering a
#     marketplace mid-session installs the files but does not surface the skills —
#     verified from inside a session, where `claude plugin install` reported
#     success for all five plugins and ListSkills still returned nothing. So
#     registration has to happen here, before launch, to land in the snapshot.
#   - The setup phase has no GitHub credentials. The session's GitHub proxy is not
#     yet in play, so a private repo cannot be cloned: openai/codex-plugin-cc
#     (public) cloned fine in the same run where ag-grid/ag-dev-prompts (private)
#     failed. The attached sibling checkout is the way in — when ag-dev-prompts is
#     attached to the session it is already on disk next to this repo, and a
#     marketplace can be registered from a local path.
#
# Setup and session share $HOME (both run as root, $HOME=/root — measured, and the
# reason the openai-codex clone from an earlier revision was visible in-session),
# so what is registered here is what the session sees.

ag_dev_marketplace_source() {
    local dir
    for dir in "${AG_DEV_PROMPTS_DIR:-}" \
        "$(dirname "$REPO_ROOT")/ag-dev-prompts" \
        /home/user/ag-dev-prompts /home/claude/ag-dev-prompts; do
        [[ -n "$dir" && -f "$dir/.claude-plugin/marketplace.json" ]] || continue
        echo "$dir"
        return 0
    done
    # No local checkout: try the network and let it fail loudly in the log.
    echo "ag-grid/ag-dev-prompts"
}

# Plugin specs the repo asks for, e.g. "ag-eng@ag-dev". Read from the committed
# settings.json rather than hardcoded, so the two cannot drift.
enabled_plugins() {
    [[ -f "$REPO_ROOT/.claude/settings.json" ]] || return 0
    node -e '
        const fs = require("fs");
        const s = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
        for (const [name, on] of Object.entries(s.enabledPlugins ?? {})) if (on) console.log(name);
    ' "$REPO_ROOT/.claude/settings.json" 2>/dev/null
}

register_marketplaces() {
    if ! command -v claude &>/dev/null; then
        log_warn "claude CLI not on PATH — cannot register plugin marketplaces; sessions will start without ag-dev skills"
        return 1
    fi

    local source
    source="$(ag_dev_marketplace_source)"
    if [[ "$source" == /* ]]; then
        log_info "registering ag-dev from the attached checkout at ${source}"
    else
        log_warn "no local ag-dev-prompts checkout found — attach ag-grid/ag-dev-prompts as a second repository to the session; trying the network, which has no credentials for a private repo at setup time"
    fi

    with_timeout 120 claude plugin marketplace add "$source" 2>&1 | sed 's/^/[cloud-setup]   /' || true
    with_timeout 60 claude plugin marketplace add openai/codex-plugin-cc 2>&1 |
        sed 's/^/[cloud-setup]   /' || true

    local plugin failed=0
    while read -r plugin; do
        [[ -n "$plugin" ]] || continue
        if ! with_timeout 60 claude plugin install "$plugin" >/dev/null 2>&1; then
            log_warn "plugin install failed: ${plugin}"
            failed=$((failed + 1))
        fi
    done < <(enabled_plugins)

    local installed
    installed="$(with_timeout 30 claude plugin list 2>/dev/null | grep -c '@' || true)"
    log_info "plugins registered: ${installed:-0} (${failed} failed)"
    ((failed == 0))
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

main() {
    log_info "repo root: ${REPO_ROOT}"
    log_info "cache dir: ${AG_CLOUD_CACHE_DIR}"

    # World-writable: the session user must be able to read the cache, and to
    # refresh it once its own install has scripted the tree.
    mkdir -p "$AG_CLOUD_CACHE_DIR" 2>/dev/null || true
    chmod 0777 "$AG_CLOUD_CACHE_DIR" 2>/dev/null || true
    if [[ ! -f "$REPO_ROOT/package.json" ]]; then
        log_warn "no package.json at ${REPO_ROOT}; nothing to set up"
        exit 0
    fi

    step "pin node" pin_node
    # Recorded unconditionally: whatever node the session should use, including
    # the preinstalled one when pinning was skipped or failed.
    record_node_path
    step "install yarn + nx" install_yarn_and_nx

    # Marketplaces first: they are seconds of work, they are the only thing that
    # cannot be repaired later in the session (skills are enumerated at launch),
    # and an earlier revision let a budget-hogging install starve them.
    step "register plugin marketplaces" register_marketplaces || true

    # Only a complete tree is worth caching. A tree cut off mid-fetch still passes
    # the lockfile-hash check the hook uses, so caching one costs a session the
    # restore time and then makes it install anyway.
    if step "yarn install" install_dependencies; then
        step "seed node_modules cache" seed_node_modules_cache
    else
        log_warn "no complete node_modules to cache; the first session must run finish-setup.sh, which caches its result for later sessions"
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
