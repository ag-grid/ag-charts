#!/bin/bash
# external/ag-shared/scripts/setup-worktree/preinstall-worktree.sh
#
# Yarn preinstall hook for worktree and cloud environments.
# Detects the environment and prepares for yarn install:
#   - Fixes broken symlinks in git worktrees
#   - COW-clones node_modules from the main repo (APFS cp -cR, rsync fallback)
#   - COW-clones .nx cache
#   - Creates .yarnrc for engine check bypass in cloud
#
# In local (non-worktree, non-cloud) checkouts, exits immediately (<20ms).

set -euo pipefail

# Recursion guard — if we're already inside a preinstall triggered by this
# script (e.g. install-for-cloud.sh calling yarn install), skip.
if [[ "${AG_PREINSTALL_ACTIVE:-}" == "1" ]]; then
    exit 0
fi
export AG_PREINSTALL_ACTIVE=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

log_info() { echo "[preinstall-worktree] $*"; }
log_error() { echo "[preinstall-worktree] ERROR: $*" >&2; }

# ---------------------------------------------------------------------------
# Environment detection
# ---------------------------------------------------------------------------

detect_mode() {
    # Cloud environment (remote Claude Code, explicit flag)
    if [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]] || [[ "${AG_CLOUD_INSTALL:-}" == "1" ]]; then
        echo "cloud"; return
    fi

    # Worktree detection: .git is a file, not a directory
    if [[ -f "$REPO_ROOT/.git" ]]; then
        echo "worktree"; return
    fi

    echo "local"
}

# ---------------------------------------------------------------------------
# COW source resolution — find the main repo to clone node_modules from
# ---------------------------------------------------------------------------

get_cow_source() {
    # Explicit override (set by claude-worktree-create.sh)
    if [[ -n "${ROOT_WORKTREE_PATH:-}" ]] && [[ -d "${ROOT_WORKTREE_PATH}/node_modules" ]]; then
        log_info "COW source: ROOT_WORKTREE_PATH=${ROOT_WORKTREE_PATH}"
        echo "$ROOT_WORKTREE_PATH"; return
    fi

    # Claude Code worktree: derive from .claude-worktrees path
    local check_path="${CLAUDE_PROJECT_DIR:-$PWD}"
    if [[ "$check_path" == *".claude-worktrees"* ]]; then
        local root="${check_path%%/.claude-worktrees/*}"
        if [[ -d "$root/node_modules" ]]; then
            log_info "COW source: .claude-worktrees root=${root}"
            echo "$root"; return
        fi
    fi

    # Git worktree: parse .git file to find main repo
    if [[ -f "$REPO_ROOT/.git" ]]; then
        local gitdir_path
        gitdir_path=$(sed 's/gitdir: //' "$REPO_ROOT/.git")

        # gitdir points to <main-repo>/.git/worktrees/<name>
        # Resolve relative paths against REPO_ROOT
        if [[ "$gitdir_path" != /* ]]; then
            gitdir_path="$REPO_ROOT/$gitdir_path"
        fi

        local main_repo
        main_repo=$(dirname "$(dirname "$(dirname "$gitdir_path")")")

        if [[ -d "$main_repo/node_modules" ]]; then
            log_info "COW source: main repo=${main_repo}"
            echo "$main_repo"; return
        fi
        log_info "Main repo ${main_repo} has no node_modules, skipping COW"
    fi

    log_info "No COW source found"
    echo ""
}

# ---------------------------------------------------------------------------
# Prompts symlink fix (from setup-worktree.sh)
# ---------------------------------------------------------------------------

detect_project_name() {
    local remote_url
    remote_url=$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || echo "")
    if [[ -z "$remote_url" ]]; then
        echo "ag-grid"
        return
    fi
    echo "$remote_url" | sed -E 's|.*[:/]([^/]+)\.git$|\1|; s|.*[:/]([^/]+)$|\1|'
}

get_main_repo_root() {
    if [[ -f "$REPO_ROOT/.git" ]]; then
        # Worktree: .git is a file containing "gitdir: /path/to/main/.git/worktrees/name"
        local gitdir_path
        gitdir_path=$(sed 's/gitdir: //' "$REPO_ROOT/.git")
        if [[ "$gitdir_path" != /* ]]; then
            gitdir_path="$REPO_ROOT/$gitdir_path"
        fi
        # Navigate up from .git/worktrees/name to main repo
        dirname "$(dirname "$(dirname "$gitdir_path")")"
    else
        echo "$REPO_ROOT"
    fi
}

fix_prompts_symlink() {
    local project_name
    project_name=$(detect_project_name)
    local prompts_dir_name="${project_name}-prompts"
    local main_repo
    main_repo=$(get_main_repo_root)
    local prompts_dir="$main_repo/../$prompts_dir_name"

    if [[ ! -d "$prompts_dir" ]]; then
        log_info "$prompts_dir_name not found at $prompts_dir, skipping symlink fix"
        return 0
    fi

    # Create symlink in worktree parent so relative paths work
    local real_prompts parent_link
    real_prompts=$(cd "$prompts_dir" && pwd)
    parent_link="$(dirname "$REPO_ROOT")/$prompts_dir_name"

    if [[ ! -e "$parent_link" ]] || [[ "$(readlink "$parent_link" 2>/dev/null)" != "$real_prompts" ]]; then
        log_info "Creating parent symlink: $parent_link -> $real_prompts"
        ln -sf "$real_prompts" "$parent_link"
    fi

    # Fix external/prompts symlink if it exists and is broken
    if [[ -L "$REPO_ROOT/external/prompts" ]] && [[ ! -e "$REPO_ROOT/external/prompts" ]]; then
        log_info "Fixing external/prompts symlink"
        rm -f "$REPO_ROOT/external/prompts"
        ln -sf "../../$prompts_dir_name" "$REPO_ROOT/external/prompts"
    fi
}

# ---------------------------------------------------------------------------
# COW clone helpers (from install-for-cloud.sh)
# ---------------------------------------------------------------------------

clone_directory() {
    local src="$1" dest="$2"
    if cp -cR "${src}/" "${dest}/" 2>/dev/null; then
        return 0
    fi
    if rsync -a "${src}/" "${dest}/"; then
        return 0
    fi
    return 1
}

try_cow_clone_node_modules() {
    local source="$1"

    # Already have node_modules? Skip.
    if [[ -d "$REPO_ROOT/node_modules" ]]; then
        log_info "node_modules/ already exists, skipping COW clone"
        return 0
    fi

    # Verify source has node_modules and matching lockfile
    if [[ ! -d "$source/node_modules" ]]; then
        log_info "Source ${source}/node_modules not found, skipping COW clone"
        return 1
    fi
    if [[ ! -f "$source/yarn.lock" ]]; then
        log_info "Source ${source}/yarn.lock not found, skipping COW clone"
        return 1
    fi
    if ! diff -q "$source/yarn.lock" "$REPO_ROOT/yarn.lock" &>/dev/null; then
        log_info "yarn.lock differs from source, skipping COW clone"
        return 1
    fi

    log_info "COW-cloning node_modules from $source"
    if clone_directory "$source/node_modules" "$REPO_ROOT/node_modules"; then
        log_info "Successfully cloned node_modules"
    else
        log_error "Failed to clone node_modules"
        rm -rf "$REPO_ROOT/node_modules"
        return 1
    fi

    # Clone nested workspace node_modules (Yarn 1 nohoist/version conflicts)
    local nested
    while IFS= read -r nested; do
        local rel_path="${nested#${source}/}"
        if [[ ! -d "$REPO_ROOT/${rel_path}" ]]; then
            mkdir -p "$(dirname "$REPO_ROOT/${rel_path}")"
            if clone_directory "${nested}" "$REPO_ROOT/${rel_path}"; then
                log_info "Cloned nested ${rel_path}"
            else
                log_info "Failed to clone nested ${rel_path}, skipping"
            fi
        fi
    done < <(find "${source}" -name "node_modules" -type d \
        -not -path "${source}/node_modules/*" \
        -not -path "${source}/node_modules" \
        -maxdepth 3 2>/dev/null)

    return 0
}

try_cow_clone_nx_cache() {
    local source="$1"

    if [[ -d "$REPO_ROOT/.nx" ]]; then
        log_info ".nx cache already exists, skipping"
        return 0
    fi

    if [[ ! -d "$source/.nx" ]]; then
        return 0
    fi

    log_info "COW-cloning .nx cache from $source"
    if clone_directory "$source/.nx" "$REPO_ROOT/.nx"; then
        log_info "Successfully cloned .nx cache"
    else
        log_info "Failed to clone .nx cache, continuing without it"
        rm -rf "$REPO_ROOT/.nx"
    fi
}

# ---------------------------------------------------------------------------
# Cloud-specific setup
# ---------------------------------------------------------------------------

create_yarnrc() {
    cat >"$REPO_ROOT/.yarnrc" <<EOF
--install.ignore-engines true
--run.ignore-engines true
EOF
    log_info "Created .yarnrc with engine bypass"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    local mode
    mode=$(detect_mode)

    log_info "Mode: ${mode} (REPO_ROOT=${REPO_ROOT})"

    case "$mode" in
        local)
            exit 0
            ;;
        worktree)
            fix_prompts_symlink || log_error "Failed to fix prompts symlink, continuing"

            local source
            source=$(get_cow_source)
            if [[ -n "$source" ]]; then
                try_cow_clone_node_modules "$source" || true
                try_cow_clone_nx_cache "$source"
            fi
            ;;
        cloud)
            create_yarnrc

            # Cloud mode may also be a worktree (e.g. AG_CLOUD_INSTALL=1 set
            # by claude-worktree-create.sh). Fix symlinks if so.
            if [[ -f "$REPO_ROOT/.git" ]]; then
                fix_prompts_symlink || log_error "Failed to fix prompts symlink, continuing"
            fi

            local source
            source=$(get_cow_source)
            if [[ -n "$source" ]]; then
                try_cow_clone_node_modules "$source" || true
                try_cow_clone_nx_cache "$source"
            fi
            ;;
    esac

    log_info "Preinstall setup complete"
}

main
