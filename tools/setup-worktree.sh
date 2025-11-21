#!/bin/bash

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# Helper function to log info messages to stdout
log_info() {
    echo "[setup-worktree] $*"
}

# Helper function to log error messages to stderr
log_error() {
    echo "[setup-worktree] ERROR: $*" >&2
}

# Check if we're in a git worktree
# In a worktree, .git is a file pointing to the main git directory
if [[ ! -f .git ]]; then
    log_error "Not in a git worktree (.git is not a file)"
    exit 1
fi

# Check if already set up
MARKER_FILE=".worktree-is-setup"
if [[ -f "$MARKER_FILE" ]]; then
    log_info "Worktree already set up (marker file exists), skipping reset and proceeding to install"
    export AG_CLOUD_INSTALL=1
    ./tools/install-for-cloud.sh
    exit 0
fi

# Extract worktree directory name from current path
# Example: /Users/bls/.cursor/worktrees/ag-charts/syG7a -> syG7a
WORKTREE_DIR_NAME=$(basename "$(pwd)")

# Stash any uncommitted changes
if git status --porcelain | grep -q .; then
    log_info "Stashing uncommitted changes"
    git stash push -m "[worktree:${WORKTREE_DIR_NAME}] wip on new worktree" || {
        log_error "Failed to stash changes"
        exit 1
    }
else
    log_info "No uncommitted changes to stash"
fi

# Determine target branch for reset
TARGET_BRANCH=""

# Check for explicit environment variable
if [[ -n "${WORKTREE_RESET_BRANCH:-}" ]]; then
    if [[ "$WORKTREE_RESET_BRANCH" == "skip" || "$WORKTREE_RESET_BRANCH" == "none" ]]; then
        log_info "WORKTREE_RESET_BRANCH set to skip, skipping reset"
        TARGET_BRANCH="skip"
    else
        TARGET_BRANCH="$WORKTREE_RESET_BRANCH"
        log_info "Using explicit target branch from WORKTREE_RESET_BRANCH: $TARGET_BRANCH"
    fi
fi

# Auto-detect branch if not explicitly set
if [[ -z "$TARGET_BRANCH" ]]; then
    log_info "Auto-detecting base branch using merge-base analysis"
    
    # Fetch origin to ensure we have latest refs
    git fetch origin --quiet 2>/dev/null || true
    
    # Get all release branches from origin
    RELEASE_BRANCHES=$(git branch -r | grep -E 'origin/b[0-9]+\.[0-9]+\.[0-9]+$' | sed 's/^[[:space:]]*//' || echo "")
    
    # Build list of candidate branches (origin/latest + all release branches)
    CANDIDATES=("origin/latest")
    if [[ -n "$RELEASE_BRANCHES" ]]; then
        while IFS= read -r branch; do
            CANDIDATES+=("$branch")
        done <<< "$RELEASE_BRANCHES"
    fi
    
    # Find the most recent common ancestor
    BEST_BRANCH=""
    BEST_MERGE_BASE=""
    BEST_COMMIT_TIME=0
    
    for candidate in "${CANDIDATES[@]}"; do
        # Get merge-base with current HEAD
        merge_base=$(git merge-base HEAD "$candidate" 2>/dev/null || echo "")
        
        if [[ -n "$merge_base" ]]; then
            # Get commit time for this merge-base
            commit_time=$(git log -1 --format=%ct "$merge_base" 2>/dev/null || echo "0")
            
            log_info "  $candidate: merge-base $merge_base (commit time: $commit_time)"
            
            # Keep track of the branch with the most recent merge-base
            if [[ $commit_time -gt $BEST_COMMIT_TIME ]]; then
                BEST_COMMIT_TIME=$commit_time
                BEST_MERGE_BASE=$merge_base
                BEST_BRANCH=$candidate
            fi
        fi
    done
    
    if [[ -n "$BEST_BRANCH" ]]; then
        TARGET_BRANCH="$BEST_BRANCH"
        log_info "Selected $TARGET_BRANCH as base branch (most recent common ancestor: ${BEST_MERGE_BASE:0:12})"
    else
        # Fallback to origin/latest if no merge-base found
        TARGET_BRANCH="origin/latest"
        log_info "Could not determine merge-base, defaulting to origin/latest"
    fi
fi

# Perform reset if not skipped
if [[ "$TARGET_BRANCH" != "skip" ]]; then
    log_info "Resetting to $TARGET_BRANCH"
    
    # Fetch the target branch first
    BRANCH_NAME="${TARGET_BRANCH#origin/}"
    git fetch origin "$BRANCH_NAME" || {
        log_error "Failed to fetch $TARGET_BRANCH"
        exit 1
    }
    
    # Reset hard to the target branch
    git reset --hard "$TARGET_BRANCH" || {
        log_error "Failed to reset to $TARGET_BRANCH"
        exit 1
    }
    
    # Clean untracked files
    git clean -fd || {
        log_error "Failed to clean untracked files"
        exit 1
    }
    
    log_info "Successfully reset to $TARGET_BRANCH"
    
    # Create marker file to prevent re-running
    touch "$MARKER_FILE"
    log_info "Created marker file to prevent re-running setup"
else
    log_info "Reset skipped, creating marker file"
    touch "$MARKER_FILE"
fi

# Proceed with install
export AG_CLOUD_INSTALL=1
./tools/install-for-cloud.sh

