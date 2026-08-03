#!/bin/bash
# external/ag-shared/scripts/install-for-cloud/install-for-cloud.sh
#
# Cloud-only bootstrap for environments where yarn/nx may not be installed.
# Called from the SessionStart hook.
#
# In most cases (yarn present + node_modules exists), exits immediately (~10ms).
# When bootstrapping is needed, installs yarn/nx globally then delegates to
# `yarn install`, which triggers preinstall-worktree.sh for COW cloning etc.

set -euo pipefail

export AG_SKIP_NATIVE_DEP_VERSION_CHECK=1
export PUPPETEER_SKIP_DOWNLOAD=true

log_info() { echo "[install-for-cloud] $*"; }
log_error() { echo "[install-for-cloud] ERROR: $*" >&2; }

# Cache seeded by cloud-setup.sh (the cloud environment's setup script). It lives
# outside the repo so it survives a re-cloned working tree, and outside $HOME
# because the setup script runs as root while the session runs as another user —
# so /opt/ag-cloud is the path both sides can agree on. The $HOME location stays
# as the fallback for local and worktree runs, where one user owns everything.
if [[ -z "${AG_CLOUD_CACHE_DIR:-}" ]]; then
    if [[ -d /opt/ag-cloud ]]; then
        AG_CLOUD_CACHE_DIR=/opt/ag-cloud
    else
        AG_CLOUD_CACHE_DIR="$HOME/.cache/ag-cloud"
    fi
fi

# ---------------------------------------------------------------------------
# Cloud session PATH — the setup script's environment does not carry over, so
# recover the node it pinned and export it for the rest of the session.
# ---------------------------------------------------------------------------

apply_cached_node_path() {
    local path_file="$AG_CLOUD_CACHE_DIR/node-bin-path"
    [[ -f "$path_file" ]] || return 0

    local bin
    bin="$(head -1 "$path_file")"
    [[ -d "$bin" ]] || return 0

    case ":$PATH:" in
    *":$bin:"*) ;;
    *) export PATH="$bin:$PATH" ;;
    esac

    if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
        echo "export PATH=\"$bin:\$PATH\"" >>"$CLAUDE_ENV_FILE"
    fi
    log_info "node $(node -v 2>/dev/null || echo '?') from ${bin}"
}

# ---------------------------------------------------------------------------
# node_modules restore — put the cached tree in place when the lockfile still
# matches, turning a multi-minute install into seconds. A lockfile mismatch
# falls through to a real install.
#
# Strategy matters at this size: a real ag-charts node_modules is ~2.3 GB over
# ~200k files, where even a hardlink copy costs over a minute. So:
#   1. reflink copy   — instant on a COW filesystem, cache kept
#   2. move           — instant on the same filesystem, cache consumed, so a
#                       detached re-seed rebuilds it for the next session
#   3. hardlink copy  — metadata only, but minutes at this file count
#   4. plain copy     — last resort
# ---------------------------------------------------------------------------

# Device id of a path — used to keep the move path off a cross-filesystem `mv`,
# which silently degrades to a full copy.
device_of() {
    stat -c %d "$1" 2>/dev/null || stat -f %d "$1" 2>/dev/null
}

same_filesystem() {
    local a b
    a="$(device_of "$1")"
    b="$(device_of "$2")"
    [[ -n "$a" && "$a" == "$b" ]]
}

reseed_cache_detached() {
    local cached="$1"
    [[ -d node_modules ]] || return 0
    # Rebuild the cache out of band: the session is already usable, and the next
    # session needs the cache back. Detached so the hook does not wait on it.
    nohup bash -c "
        staging='${cached}.staging.\$\$'
        rm -rf \"\$staging\"
        cp -al '$PWD/node_modules' \"\$staging\" 2>/dev/null ||
            cp -a '$PWD/node_modules' \"\$staging\" 2>/dev/null || exit 0
        rm -rf '$cached'
        mv \"\$staging\" '$cached'
    " >/dev/null 2>&1 &
    disown 2>/dev/null || true
    log_info "cache re-seed running in the background"
}

restore_node_modules_from_cache() {
    local cached="$AG_CLOUD_CACHE_DIR/node_modules"
    local hash_file="$AG_CLOUD_CACHE_DIR/yarn.lock.sha256"

    [[ -d "$cached" ]] || return 1
    [[ ! -d node_modules ]] || return 1
    [[ -f yarn.lock && -f "$hash_file" ]] || return 1

    local want have
    if command -v sha256sum &>/dev/null; then
        want="$(sha256sum yarn.lock | awk '{print $1}')"
    else
        want="$(shasum -a 256 yarn.lock | awk '{print $1}')"
    fi
    have="$(head -1 "$hash_file")"
    if [[ "$want" != "$have" ]]; then
        log_info "cached node_modules is for a different yarn.lock, ignoring it"
        return 1
    fi

    log_info "restoring node_modules from ${cached}"
    local start=$SECONDS
    local staging="node_modules.restoring.$$"
    rm -rf "$staging"

    if cp -a --reflink=always "$cached" "$staging" 2>/dev/null; then
        mv "$staging" node_modules
        log_info "node_modules restored by reflink in $((SECONDS - start))s"
        return 0
    fi
    rm -rf "$staging"

    if same_filesystem "$cached" "$PWD" && mv "$cached" "$staging" 2>/dev/null; then
        mv "$staging" node_modules
        log_info "node_modules restored by move in $((SECONDS - start))s"
        # Skip the re-seed when the tree is unscripted: the background install is
        # about to run and refreshes the cache itself, and two jobs writing the
        # same cache directory is pure waste.
        if [[ ! -f "$AG_CLOUD_CACHE_DIR/unscripted" ]]; then
            reseed_cache_detached "$cached"
        fi
        return 0
    fi

    if cp -al "$cached" "$staging" 2>/dev/null || cp -a "$cached" "$staging" 2>/dev/null; then
        mv "$staging" node_modules
        log_info "node_modules restored by copy in $((SECONDS - start))s"
        return 0
    fi

    rm -rf "$staging"
    log_info "could not restore from cache, falling back to install"
    return 1
}

# ---------------------------------------------------------------------------
# Background install — cloud sessions only.
#
# Claude Code waits for SessionStart hooks to finish before it processes the
# first message, so a blocking `yarn install` here freezes the whole session for
# minutes with no output at all: measured in a real cloud session, which sat
# silent for 9+ minutes and never answered. Correctness still requires a full
# install, so run it detached and tell the session what is happening and how to
# wait, instead of stalling it.
#
# Local and worktree runs keep the original blocking behaviour: there is a human
# watching a terminal there, and no session to starve.
# ---------------------------------------------------------------------------

deps_state_dir() { echo "${AG_CLOUD_CACHE_DIR}/deps"; }

start_background_install() {
    local state
    state="$(deps_state_dir)"
    mkdir -p "$state"

    # Lock via mkdir so a second hook run (resume, parallel session) does not
    # start a competing install.
    if ! mkdir "$state/lock" 2>/dev/null; then
        log_info "an install is already running (lock held), not starting another"
        return 0
    fi

    rm -f "$state/ready" "$state/failed"
    date +%s >"$state/started"

    nohup bash -c "
        cd '$PWD' || exit 1
        export AG_SKIP_NATIVE_DEP_VERSION_CHECK=1 PUPPETEER_SKIP_DOWNLOAD=true NX_DAEMON=false
        if yarn install --prefer-offline >'$state/install.log' 2>&1; then
            date +%s >'$state/ready'
            # The tree is now scripted and patched. Refresh the cache from it and
            # drop the marker so later sessions restore a ready-to-build tree.
            if [ -f '$AG_CLOUD_CACHE_DIR/unscripted' ]; then
                staging='$AG_CLOUD_CACHE_DIR/node_modules.scripted.\$\$'
                rm -rf \"\$staging\"
                if cp -al node_modules \"\$staging\" 2>/dev/null || cp -a node_modules \"\$staging\" 2>/dev/null; then
                    rm -rf '$AG_CLOUD_CACHE_DIR/node_modules'
                    mv \"\$staging\" '$AG_CLOUD_CACHE_DIR/node_modules'
                    rm -f '$AG_CLOUD_CACHE_DIR/unscripted'
                fi
            fi
        else
            date +%s >'$state/failed'
        fi
        rmdir '$state/lock' 2>/dev/null
    " >/dev/null 2>&1 &
    disown 2>/dev/null || true

    # Hook stdout becomes session context, so this is the message Claude reads.
    local reason="no valid node_modules and no seeded cache were found"
    if [[ -f "$AG_CLOUD_CACHE_DIR/unscripted" ]]; then
        reason="the cached node_modules was seeded without postinstall, so patches and plugin builds are still pending"
    fi
    cat <<EOF
[install-for-cloud] Dependencies are NOT ready yet in this cloud session.

A 'yarn install' is running in the background because ${reason}. Until it
completes, builds, tests, lint and any 'yarn nx' command will fail or behave
oddly. Reading and editing files is fine.

Before running any build/test/lint command, wait for it:
  bash external/ag-shared/scripts/install-for-cloud/wait-for-deps.sh

Progress log: $state/install.log
EOF
    log_info "background install started; session is usable immediately"
}

# ---------------------------------------------------------------------------
# Environment detection — same signals as before
# ---------------------------------------------------------------------------

is_claude_worktree() {
    local check_path="${CLAUDE_PROJECT_DIR:-$PWD}"
    [[ "$check_path" == *".claude-worktrees"* ]]
}

RUN_MODE="skip"
if [[ "${AG_CLOUD_INSTALL:-}" == "1" ]]; then
    log_info "AG_CLOUD_INSTALL set, initializing environment"
    RUN_MODE="full"
elif [[ "${AG_CLOUD_INSTALL:-}" == "0" ]]; then
    log_info "Disabled by AG_CLOUD_INSTALL, skipping environment initialization"
    exit 0
elif [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]]; then
    log_info "CLAUDE_CODE_REMOTE set, initializing environment"
    RUN_MODE="full"
elif is_claude_worktree; then
    log_info "Claude Code worktree detected"
    RUN_MODE="full"
else
    log_info "No cloud/worktree environment detected, skipping initialization"
    log_info "CLAUDE_PROJECT_DIR: ${CLAUDE_PROJECT_DIR:-}"
    log_info "PWD: $PWD"
    exit 0
fi

# ---------------------------------------------------------------------------
# Cloud sessions: recover the pinned node and the cached dependency tree that
# cloud-setup.sh left behind, before deciding whether an install is needed.
# ---------------------------------------------------------------------------

IN_CLOUD_SESSION=0
if [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]] || [[ "${AG_CLOUD_INSTALL:-}" == "1" ]]; then
    IN_CLOUD_SESSION=1
    apply_cached_node_path
    if [[ -f package.json ]]; then
        if restore_node_modules_from_cache; then
            # A cache seeded with --ignore-scripts passes the integrity check but
            # has no patches applied, so the fast path below would wrongly call it
            # ready. Script it in the background instead.
            if [[ -f "$AG_CLOUD_CACHE_DIR/unscripted" ]]; then
                log_info "restored tree is unscripted (no patches yet)"
                start_background_install
                exit 0
            fi
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Fast path — if yarn exists and node_modules is present, nothing to do.
# The preinstall-worktree.sh hook handles COW cloning and symlink fixes
# when yarn install is eventually triggered.
# ---------------------------------------------------------------------------

if command -v yarn &>/dev/null && [[ -d node_modules ]]; then
    # Verify lockfile hasn't changed since last install — Yarn 1 writes
    # node_modules/.yarn-integrity which embeds a lockfile hash.
    if yarn check --integrity &>/dev/null; then
        log_info "yarn and node_modules present and valid, skipping bootstrap"
        exit 0
    fi
    log_info "node_modules present but integrity check failed, install needed"
    if [[ "$IN_CLOUD_SESSION" == "1" ]]; then
        start_background_install
        exit 0
    fi
    yarn install --prefer-offline
    exit $?
fi

# ---------------------------------------------------------------------------
# Ensure we're in the project directory
# ---------------------------------------------------------------------------

if [[ ! -f package.json ]]; then
    log_error "package.json not found in current directory"
    exit 2
fi

# ---------------------------------------------------------------------------
# Bootstrap: install yarn and nx globally if missing
# ---------------------------------------------------------------------------

install_yarn_if_missing() {
    # Create .yarnrc to ignore engine checks
    cat >.yarnrc <<EOF
--install.ignore-engines true
--run.ignore-engines true
EOF

    if command -v yarn &>/dev/null; then
        log_info "yarn is already installed"
        return 0
    fi

    log_info "Installing yarn@1 globally"
    if ! npm i -g --force yarn@1; then
        log_error "Failed to install yarn@1 globally"
        return 2
    fi
    log_info "yarn@1 installed successfully"
}

install_nx_if_missing() {
    if command -v nx &>/dev/null; then
        log_info "nx is already installed"
        return 0
    fi

    if ! command -v node &>/dev/null; then
        log_error "node is not available"
        return 2
    fi

    local nx_version
    nx_version=$(node -p "require('./package.json').devDependencies.nx" 2>/dev/null) || {
        log_error "Failed to extract nx version from package.json"
        return 2
    }

    log_info "Installing nx@${nx_version} globally"
    if ! yarn global add "nx@${nx_version}"; then
        log_error "Failed to install nx globally"
        return 2
    fi
    log_info "Successfully installed nx@${nx_version}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    log_info "Bootstrapping cloud environment"

    if ! install_yarn_if_missing; then
        exit 2
    fi

    if ! install_nx_if_missing; then
        exit 2
    fi

    # In a cloud session the install must not block the SessionStart hook.
    if [[ "$IN_CLOUD_SESSION" == "1" ]]; then
        start_background_install
        exit 0
    fi

    # Delegate to yarn install — preinstall-worktree.sh handles COW cloning,
    # symlink fixes, and .nx cache. Postinstall handles patches, plugins, etc.
    log_info "Running yarn install (preinstall hook will handle COW cloning)"
    if ! yarn install --prefer-offline; then
        log_error "yarn install failed"
        exit 2
    fi

    # Verify nx is available
    if command -v nx &>/dev/null; then
        log_info "Bootstrap completed successfully — nx is available"
    else
        log_info "Bootstrap completed — nx may require shell restart to be available in PATH"
    fi

    exit 0
}

main
