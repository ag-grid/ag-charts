#!/bin/bash
# external/ag-shared/scripts/setup-worktree/claude-worktree-remove.sh
# Claude Code WorktreeRemove hook — safely removes a git worktree.
#
# Receives JSON on stdin from Claude Code:
#   { "worktree_path": "/path/to/worktree", ... }
# All output to stderr (no stdout contract for WorktreeRemove).

set -euo pipefail

INPUT=$(cat)
WT_PATH=$(echo "$INPUT" | jq -r '.worktree_path')

log() { echo "[claude-wt-rm] $*" >&2; }

# Git runs hooks and helpers that could outlive this script; they must not inherit the lock descriptor.
git() { command git "$@" 9>&-; }

# The create hook's cleanup may have this worktree moved aside to .removing-<name> while it holds this lock. Take the
# lock before judging the path, so the worktree is either back in place, gone, or left aside by an interrupted run.
WT_DIR=$(dirname "$WT_PATH")
if [[ -n "$WT_PATH" && -z "${CLAUDE_WT_CLEANUP_LOCKED:-}" && -d "$WT_DIR" ]]; then
    LOCK="$WT_DIR/.cleanup.lock"
    if ! exec 9>>"$LOCK"; then
        log "Cannot open $LOCK; not removing ${WT_PATH}"
        exit 1
    fi
    if command -v flock >/dev/null; then
        flock -w 120 9 || { log "Timed out waiting for $LOCK; not removing ${WT_PATH}"; exit 1; }
    elif command -v perl >/dev/null; then
        perl -MFcntl=:flock -e 'alarm 120; open(my $fh, ">&=", 9) or exit 1; flock($fh, LOCK_EX) or exit 1' ||
            { log "Timed out waiting for $LOCK; not removing ${WT_PATH}"; exit 1; }
    else
        log "Cannot lock $LOCK; not removing ${WT_PATH}"
        exit 1
    fi
    # A worktree left aside by an interrupted cleanup is still the one asked for, if the create hook's record in
    # its git dir names this path. Git's record is repaired first, in case the move stopped before updating it.
    HIDDEN="$WT_DIR/.removing-$(basename "$WT_PATH")"
    if [[ ! -e "$WT_PATH" && -e "$HIDDEN/.git" ]] && HIDDEN_GIT_DIR=$(git -C "$HIDDEN" rev-parse --absolute-git-dir 2>/dev/null) &&
        [[ "$(cat "$HIDDEN_GIT_DIR/claude-moved-from" 2>/dev/null)" == "$(cd -P "$WT_DIR" && pwd)/$(basename "$WT_PATH")" ]]; then
        log "Removing ${WT_PATH} from where an interrupted cleanup left it: ${HIDDEN}"
        git -C "$HIDDEN" worktree repair >/dev/null 2>&1 || true
        WT_PATH=$HIDDEN
    fi
fi

if [[ -z "$WT_PATH" || ! -d "$WT_PATH" ]]; then
    log "Worktree path not found or empty: ${WT_PATH:-<none>}"
    exit 0
fi

# Safety: commit uncommitted changes before removal. A checkout whose status cannot be read is not removed.
if [[ -e "$WT_PATH/.git" ]]; then
    if ! changes=$(git -C "$WT_PATH" status --porcelain 2>/dev/null); then
        log "Cannot read git status of ${WT_PATH}; not removing it"
        exit 1
    fi
    if [[ -n "$changes" ]]; then
        log "Committing uncommitted changes in ${WT_PATH}..."
        git -C "$WT_PATH" add -A >&2
        git -C "$WT_PATH" commit -m "wip - commit before worktree removal" >&2
    fi
fi

# Git commands address the worktree's own repository, whatever directory this hook runs in.
WT_GIT_DIR='' COMMON_DIR=''
if WT_GIT_DIR=$(git -C "$WT_PATH" rev-parse --absolute-git-dir 2>/dev/null); then
    COMMON_DIR=$(git -C "$WT_PATH" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || COMMON_DIR=''
fi
repo_git() {
    if [[ -n "$COMMON_DIR" ]]; then git --git-dir="$COMMON_DIR" "$@"; else git "$@"; fi
}

log "Removing worktree: ${WT_PATH}"
# Git's refusal stands for a registered checkout (a locked one, say), leaving it intact for the caller to restore.
if [[ -n "$WT_GIT_DIR" ]]; then
    if ! repo_git worktree remove --force "$WT_PATH" >&2; then
        log "git refused to remove ${WT_PATH}; leaving it in place"
        exit 1
    fi
elif ! git worktree remove --force "$WT_PATH" >&2 2>/dev/null; then
    log "git worktree remove failed, falling back to rm + prune..."
    rm -rf "$WT_PATH"
    repo_git worktree prune >&2 2>/dev/null || true
fi

# Belt-and-suspenders: verify removal.
if [[ -d "$WT_PATH" ]]; then
    log "Directory still exists after removal, force-removing..."
    rm -rf "$WT_PATH"
    repo_git worktree prune >&2 2>/dev/null || true
fi

# Git drops a worktree's admin dir with its registration.
if [[ -n "$WT_GIT_DIR" && -d "$WT_GIT_DIR" ]]; then
    log "git still registers the removed worktree (${WT_GIT_DIR}); run git worktree prune"
    exit 1
fi

log "Done."
