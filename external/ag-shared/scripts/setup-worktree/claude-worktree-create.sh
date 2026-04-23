#!/bin/bash
# external/ag-shared/scripts/setup-worktree/claude-worktree-create.sh
# Claude Code WorktreeCreate hook — creates a git worktree and runs setup.
#
# Receives JSON on stdin from Claude Code:
#   { "name": "branch-name", "cwd": "/path/to/repo", ... }
# Must print the absolute worktree path on stdout. All other output to stderr.

set -euo pipefail

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name')
CWD=$(echo "$INPUT" | jq -r '.cwd')

log() { echo "[claude-wt] $*" >&2; }

# Detect repo name from git remote origin URL.
detect_repo_name() {
    local remote_url
    remote_url=$(git -C "$CWD" remote get-url origin 2>/dev/null || echo "")
    if [[ -z "$remote_url" ]]; then
        basename "$CWD"
        return
    fi
    echo "$remote_url" | sed -E 's|.*[:/]([^/]+)\.git$|\1|; s|.*[:/]([^/]+)$|\1|'
}

REPO_NAME=$(detect_repo_name)
DIR_NAME=$(echo "$NAME" | tr '/' '-')
WORKTREE_ROOT="$HOME/.worktrees"
WT_PATH="${WORKTREE_ROOT}/${REPO_NAME}/${DIR_NAME}"

# Clean up stale agent worktrees from previous runs.
# Claude Code does not trigger the WorktreeRemove hook for Agent subagent
# worktrees, so we clean them up opportunistically here.
cleanup_stale_agent_worktrees() {
    local repo_wt_dir="${WORKTREE_ROOT}/${REPO_NAME}"
    [[ -d "$repo_wt_dir" ]] || return 0

    local remove_script
    remove_script="$(dirname "$0")/claude-worktree-remove.sh"

    for candidate in "$repo_wt_dir"/agent-*; do
        [[ -d "$candidate" ]] || continue
        # Never clean up the worktree we're about to create.
        [[ "$candidate" == "$WT_PATH" ]] && continue

        log "Cleaning up stale agent worktree: $candidate"
        echo "{\"worktree_path\": \"$candidate\"}" | bash "$remove_script" 2>&1 | while IFS= read -r line; do log "$line"; done || true
    done
}

cleanup_stale_agent_worktrees

log "Creating worktree '${NAME}' for ${REPO_NAME}..."

log "Fetching from origin..."
git -C "$CWD" fetch origin --quiet >&2 || log "WARNING: git fetch failed, continuing with local refs"

mkdir -p "${WORKTREE_ROOT}/${REPO_NAME}"

# Create worktree — handle existing branch (local/remote) or create new.
if git -C "$CWD" show-ref --verify --quiet "refs/heads/${NAME}" 2>/dev/null; then
    log "Branch '${NAME}' exists locally, checking out..."
    git -C "$CWD" worktree add "$WT_PATH" "$NAME" >&2
elif git -C "$CWD" show-ref --verify --quiet "refs/remotes/origin/${NAME}" 2>/dev/null; then
    log "Branch '${NAME}' exists on remote, checking out..."
    git -C "$CWD" worktree add "$WT_PATH" "$NAME" >&2
else
    log "Creating new branch '${NAME}' from origin/latest..."
    git -C "$CWD" worktree add "$WT_PATH" -b "$NAME" origin/latest >&2
fi

# Set up the worktree. Strategy:
#   1. Run preinstall-worktree.sh directly — it fixes external symlinks and
#      COW-clones node_modules, .nx cache, and plugins/*/dist. On success it
#      writes node_modules/.ag-worktree-fast-path-ok.
#   2. If the marker exists → skip yarn install entirely and run only the
#      essential post-install steps (git hooks, prompts).
#   3. If the marker is missing → fall back to full `yarn install` with the
#      preinstall guard set so we don't duplicate the COW work.
export ROOT_WORKTREE_PATH="$CWD"
export AG_SKIP_NATIVE_DEP_VERSION_CHECK=1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -f "$WT_PATH/package.json" ]]; then
    log "Running preinstall (COW clone + symlink fix)..."
    (cd "$WT_PATH" && bash "$SCRIPT_DIR/preinstall-worktree.sh" 2>&1 | while IFS= read -r line; do log "$line"; done) || true

    if [[ -f "$WT_PATH/node_modules/.ag-worktree-fast-path-ok" ]]; then
        log "Fast path: skipping yarn install, running minimal post-setup..."
        # Git hooks — set up on the worktree's shared .git dir (cheap, idempotent).
        (cd "$WT_PATH" && ./external/ag-shared/scripts/git-hooks/setup-hooks.sh 2>&1 | while IFS= read -r line; do log "$line"; done) || log "WARNING: git hooks setup failed"
        # Prompts — stage rulesync content for non-Claude tools.
        (cd "$WT_PATH" && AG_DEV_PROMPTS_REF=canary ./external/ag-shared/scripts/setup-prompts/setup-prompts.sh --postinstall 2>&1 | while IFS= read -r line; do log "$line"; done) || log "WARNING: setup-prompts failed"
    else
        log "Slow path: running yarn install --offline --frozen-lockfile..."
        # AG_PREINSTALL_ACTIVE=1 prevents yarn's preinstall hook from
        # re-running the COW work we just completed.
        (cd "$WT_PATH" && AG_PREINSTALL_ACTIVE=1 yarn install --offline --frozen-lockfile 2>&1 | tail -20) >&2 || \
            (cd "$WT_PATH" && AG_PREINSTALL_ACTIVE=1 yarn install --prefer-offline 2>&1 | tail -20) >&2
    fi
fi

log "Worktree ready at: ${WT_PATH}"
echo "$WT_PATH"
