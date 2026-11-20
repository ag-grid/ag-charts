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
    # A worktree left aside by an interrupted cleanup is still the one asked for.
    HIDDEN="$WT_DIR/.removing-$(basename "$WT_PATH")"
    if [[ ! -e "$WT_PATH" && -e "$HIDDEN/.git" ]]; then
        log "Removing ${WT_PATH} from where an interrupted cleanup left it: ${HIDDEN}"
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

log "Removing worktree: ${WT_PATH}"
if ! git worktree remove --force "$WT_PATH" >&2 2>/dev/null; then
    log "git worktree remove failed, falling back to rm + prune..."
    rm -rf "$WT_PATH"
    git worktree prune >&2 2>/dev/null || true
fi

# Belt-and-suspenders: verify removal.
if [[ -d "$WT_PATH" ]]; then
    log "Directory still exists after removal, force-removing..."
    rm -rf "$WT_PATH"
    git worktree prune >&2 2>/dev/null || true
fi

log "Done."
