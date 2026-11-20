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

# Agents run in parallel, so only worktrees idle for this long count as stale.
STALE_AGENT_WORKTREE_MINUTES=$((24 * 60))
# Per-worktree file in its git dir naming the Claude Code process that created it.
OWNER_FILE_NAME=claude-owner

# Prints a process's start time with whitespace collapsed, so pid reuse can be told apart.
start_time() {
    local started
    started=$(ps -o lstart= -p "$1" 2>/dev/null) || return 1
    echo $started
}

# Prints the pid and start time of the Claude Code process running this hook, if found.
claude_owner() {
    local pid=$PPID args claude_re='(^|/)claude( |$)'
    while [[ -n "$pid" && "$pid" -gt 1 ]]; do
        args=$(ps -o args= -p "$pid" 2>/dev/null) || return 1
        if [[ "$args" =~ $claude_re || "$args" == *claude-code/cli.js* ]]; then
            echo "$pid $(start_time "$pid")"
            return 0
        fi
        pid=$(ps -o ppid= -p "$pid" | tr -d ' ')
    done
    return 1
}

# True while the Claude Code process that created the worktree is still running.
owner_alive() {
    local owner_file=$1 pid started
    [[ -f "$owner_file" ]] || return 1
    read -r pid started <"$owner_file" || [[ -n "$pid" ]] || return 1
    [[ "$pid" =~ ^[0-9]+$ ]] || return 1
    [[ "$(start_time "$pid")" == "$started" ]]
}

# Exits 0 when find matches a path modified or changed within the stale window, 2 when its scan failed other than on a vanished path, else 1.
find_recent() {
    local err_file found='' status=0
    err_file=$(mktemp)
    found=$(LC_ALL=C find "$@" \( -mmin "-${STALE_AGENT_WORKTREE_MINUTES}" -o -cmin "-${STALE_AGENT_WORKTREE_MINUTES}" \) -print -quit 2>"$err_file") || status=$?
    if [[ -n "$found" ]]; then
        status=0
    elif [[ $status -ne 0 ]] && { [[ ! -s "$err_file" ]] || grep -qv 'No such file or directory$' "$err_file"; }; then
        status=2
    else
        status=1
    fi
    rm -f "$err_file"
    return $status
}

# True when the worktree's owner is running, or the worktree, its git metadata or any file in it was touched within the stale window. A failed scan counts as active.
recently_active() {
    local candidate=$1 git_dir='' path
    local paths=()
    if [[ -e "$candidate/.git" ]] && git_dir=$(git -C "$candidate" rev-parse --absolute-git-dir 2>/dev/null); then
        owner_alive "$git_dir/$OWNER_FILE_NAME" && return 0
        for path in "$git_dir/index" "$git_dir/HEAD" "$git_dir/logs/HEAD"; do
            [[ -e "$path" ]] && paths+=("$path")
        done
        ((${#paths[@]})) && { find_recent "${paths[@]}" -maxdepth 0 || (($? == 2)); } && return 0
    fi
    # One walk of the worktree, ignored files included; also covers leftovers without git metadata.
    find_recent "$candidate" || (($? == 2))
}

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
        if recently_active "$candidate"; then
            log "Keeping active agent worktree: $candidate"
            continue
        fi

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

# Record the owning Claude Code process so cleanup keeps this worktree while it runs.
if OWNER=$(claude_owner) && WT_GIT_DIR=$(git -C "$WT_PATH" rev-parse --absolute-git-dir 2>/dev/null); then
    echo "$OWNER" >"$WT_GIT_DIR/$OWNER_FILE_NAME"
fi

# Set up the worktree (COW clone when possible, else yarn install). ROOT_WORKTREE_PATH
# tells preinstall-worktree.sh which checkout to clone node_modules from.
export ROOT_WORKTREE_PATH="$CWD"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# A setup failure fails the hook (pipefail), rather than reporting a ready
# worktree without its dependencies.
if [[ -f "$WT_PATH/package.json" ]]; then
    bash "$SCRIPT_DIR/setup-worktree.sh" "$WT_PATH" 2>&1 | while IFS= read -r line; do log "$line"; done
fi

log "Worktree ready at: ${WT_PATH}"
echo "$WT_PATH"
