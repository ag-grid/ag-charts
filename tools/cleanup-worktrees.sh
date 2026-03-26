#!/bin/bash

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Helper function to log info messages to stdout
log_info() {
    echo "[cleanup-worktree] $*"
}

# Helper function to log error messages to stderr
log_error() {
    echo "[cleanup-worktree] ERROR: $*" >&2
}

# Resolve the Cursor worktree root and current repo path
CURSOR_WORKTREE_ROOT="${HOME}/.cursor/worktrees/ag-charts"
CURRENT_REPO_PATH=$(git rev-parse --show-toplevel)

log_info "Cursor worktree root: $CURSOR_WORKTREE_ROOT"
log_info "Current repo path: $CURRENT_REPO_PATH"

# Check if the worktree root exists
if [[ ! -d "$CURSOR_WORKTREE_ROOT" ]]; then
    log_info "No Cursor worktree root found at $CURSOR_WORKTREE_ROOT, nothing to clean up"
    exit 0
fi

# Track if any removals failed
REMOVAL_FAILED=0

# Iterate through each directory in the worktree root
for worktree_path in "$CURSOR_WORKTREE_ROOT"/*; do
    # Skip if not a directory
    if [[ ! -d "$worktree_path" ]]; then
        continue
    fi
    
    # Skip the current worktree if we're running from one
    if [[ "$worktree_path" == "$CURRENT_REPO_PATH" ]]; then
        log_info "Skipping current worktree: $worktree_path"
        continue
    fi
    
    # Verify it's a git worktree (has .git file)
    if [[ ! -f "$worktree_path/.git" ]]; then
        log_info "Skipping non-worktree directory: $worktree_path"
        continue
    fi
    
    log_info "Processing worktree: $worktree_path"
    
    # Check for uncommitted changes
    if git -C "$worktree_path" status --porcelain | grep -q .; then
        log_info "Found uncommitted changes in $worktree_path, committing..."
        git -C "$worktree_path" add -A || {
            log_error "Failed to stage changes in $worktree_path"
            REMOVAL_FAILED=1
            continue
        }
        git -C "$worktree_path" commit -m "wip - commit before worktree removal" || {
            log_error "Failed to commit changes in $worktree_path"
            REMOVAL_FAILED=1
            continue
        }
        log_info "Successfully committed changes in $worktree_path"
    else
        log_info "No uncommitted changes in $worktree_path"
    fi
    
    # Remove the worktree forcefully
    log_info "Removing worktree: $worktree_path"
    if git worktree remove --force "$worktree_path"; then
        log_info "Successfully removed worktree: $worktree_path"
    else
        log_error "Failed to remove worktree: $worktree_path"
        REMOVAL_FAILED=1
    fi
done

# Exit with error if any removals failed
if [[ $REMOVAL_FAILED -eq 1 ]]; then
    log_error "Some worktree removals failed"
    exit 1
fi

log_info "Cleanup complete"

