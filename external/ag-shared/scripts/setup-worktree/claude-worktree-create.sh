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

# Prints the pid of the Claude Code process running this hook, if found.
claude_owner() {
    local pid=$PPID args claude_re='(^|/)claude( |$)'
    while [[ -n "$pid" && "$pid" -gt 1 ]]; do
        args=$(ps -o args= -p "$pid" 2>/dev/null) || return 1
        if [[ "$args" =~ $claude_re || "$args" == *claude-code/cli.js* ]]; then
            echo "$pid"
            return 0
        fi
        pid=$(ps -o ppid= -p "$pid" | tr -d ' ')
    done
    return 1
}

# Prints alive, exited or unknown for the Claude Code process recorded in the owner file.
# Any process holding the pid counts as alive, so pid reuse keeps the worktree rather than risking it.
owner_state() {
    local owner_file=$1 pid=''
    [[ -f "$owner_file" ]] && { read -r pid <"$owner_file" || [[ -n "$pid" ]]; } && [[ "$pid" =~ ^[0-9]+$ ]] || {
        echo unknown
        return
    }
    if ps -o pid= -p "$pid" >/dev/null 2>&1; then
        echo alive
    # Only a working ps that no longer lists the process proves it exited.
    elif ps -o pid= -p $$ >/dev/null 2>&1; then
        echo exited
    else
        echo unknown
    fi
}

# Prints the working directory of each of the user's processes; fails unless every live one was read.
process_cwds() {
    local proc
    if [[ -d /proc/self ]]; then
        for proc in /proc/[0-9]*; do
            [[ -O "$proc" ]] || continue
            # A process that exited mid-listing is fine; a live one hiding its cwd is not.
            readlink "$proc/cwd" 2>/dev/null || [[ ! -e "$proc" ]] || return 1
        done
        return 0
    fi
    command -v lsof >/dev/null || return 1
    local listing
    listing=$(lsof -a -d cwd -u "$(id -u)" -Fpn 2>/dev/null) || return 1
    # Each process record (p) must be followed by its cwd name (n).
    awk '/^p/ { if (open) bad = 1; open = 1; next } /^n/ { print substr($0, 2); open = 0 } END { exit bad || open }' <<<"$listing"
}

# True when a running process of the user has its working directory inside the path, or the processes cannot all be read.
in_use() {
    local real_path cwds
    real_path=$(cd -P "$1" && pwd) || return 0
    cwds=$(process_cwds) || return 0
    awk -v p="$real_path" '$0 == p || index($0, p "/") == 1 { found = 1 } END { exit !found }' <<<"$cwds"
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

# Prints why the worktree must be kept, or nothing when its owner has exited and nothing in it changed within the stale window.
keep_reason() {
    local candidate=$1 git_dir=''
    if [[ ! -e "$candidate/.git" ]] || ! git_dir=$(git -C "$candidate" rev-parse --absolute-git-dir 2>/dev/null); then
        echo "unknown owner, remove it by hand if unused"
        return
    fi
    case $(owner_state "$git_dir/$OWNER_FILE_NAME") in
    alive) echo "owner running" && return ;;
    unknown) echo "unknown owner, remove it by hand if unused" && return ;;
    esac
    # Absent metadata files are skipped by find_recent; inaccessible ones fail the probe.
    if find_recent "$git_dir/index" "$git_dir/HEAD" "$git_dir/logs/HEAD" -maxdepth 0 || (($? == 2)); then
        echo "recently active"
        return
    fi
    # One walk of the worktree, ignored files included. A failed scan counts as active.
    if find_recent "$candidate" || (($? == 2)); then
        echo "recently active"
        return
    fi
    # Checked last, just before removal, to catch sessions started in the worktree after its owner exited.
    if in_use "$candidate"; then
        echo "in use by a running process, or processes could not all be read"
    fi
}

# Clean up stale agent worktrees from previous runs.
# Claude Code does not trigger the WorktreeRemove hook for Agent subagent
# worktrees, so we clean them up opportunistically here.
cleanup_stale_agent_worktrees() {
    local repo_wt_dir="${WORKTREE_ROOT}/${REPO_NAME}"
    [[ -d "$repo_wt_dir" ]] || return 0

    local remove_script candidate reason
    remove_script="$(dirname "$0")/claude-worktree-remove.sh"

    for candidate in "$repo_wt_dir"/agent-*; do
        [[ -d "$candidate" ]] || continue
        # Never clean up the worktree we're about to create.
        [[ "$candidate" == "$WT_PATH" ]] && continue
        reason=$(keep_reason "$candidate")
        if [[ -n "$reason" ]]; then
            log "Keeping agent worktree ($reason): $candidate"
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
if ! { OWNER=$(claude_owner) && WT_GIT_DIR=$(git -C "$WT_PATH" rev-parse --absolute-git-dir 2>/dev/null) && echo "$OWNER" 2>/dev/null >"$WT_GIT_DIR/$OWNER_FILE_NAME"; }; then
    log "WARNING: could not record the owning Claude Code process; stale cleanup will keep this worktree"
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
