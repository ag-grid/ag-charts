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
    # Try to get upstream branch
    UPSTREAM_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
    
    if [[ -n "$UPSTREAM_BRANCH" ]]; then
        # Check if upstream matches release branch pattern (bX.Y.Z)
        if [[ "$UPSTREAM_BRANCH" =~ ^origin/b[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            TARGET_BRANCH="$UPSTREAM_BRANCH"
            log_info "Auto-detected release branch from upstream: $TARGET_BRANCH"
        else
            # Upstream exists but not a release branch, default to latest
            TARGET_BRANCH="origin/latest"
            log_info "Upstream branch ($UPSTREAM_BRANCH) is not a release branch, defaulting to origin/latest"
        fi
    else
        # No upstream, default to latest
        TARGET_BRANCH="origin/latest"
        log_info "No upstream branch found, defaulting to origin/latest"
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

