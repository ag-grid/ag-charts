#!/bin/bash

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

log_info() { echo "[setup-worktree] $*"; }
log_error() { echo "[setup-worktree] ERROR: $*" >&2; }

# Fix tools/prompts symlink in worktrees by creating a parent symlink that
# allows the relative path (../../ag-charts-prompts) to resolve correctly.
fix_prompts_symlink() {
    # Parse .git file to find main repo: "gitdir: /path/to/main/.git/worktrees/name"
    local gitdir main_repo prompts_dir
    gitdir=$(sed 's/gitdir: //' .git)
    main_repo=$(dirname "$(dirname "$(dirname "$gitdir")")")
    prompts_dir="$main_repo/../ag-charts-prompts"

    if [[ ! -d "$prompts_dir" ]]; then
        log_info "ag-charts-prompts not found, skipping symlink fix"
        return 0
    fi

    # Create symlink in worktree parent so relative path works
    local real_prompts parent_link
    real_prompts=$(cd "$prompts_dir" && pwd)
    parent_link="$(dirname "$(pwd)")/ag-charts-prompts"

    if [[ ! -e "$parent_link" ]] || [[ "$(readlink "$parent_link" 2>/dev/null)" != "$real_prompts" ]]; then
        log_info "Creating parent symlink: $parent_link -> $real_prompts"
        ln -sf "$real_prompts" "$parent_link"
    fi

    # Recreate tools/prompts if broken or missing
    if [[ ! -e "tools/prompts" ]]; then
        log_info "Fixing tools/prompts symlink"
        rm -f "tools/prompts"
        ln -sf "../../ag-charts-prompts" "tools/prompts"
    fi
}

# Verify we're in a git worktree (.git is a file, not a directory)
if [[ ! -f .git ]]; then
    log_error "Not in a git worktree (.git is not a file)"
    exit 1
fi

# Fix prompts symlink (always, in case it's broken)
fix_prompts_symlink || log_error "Failed to fix prompts symlink, continuing anyway"

# Run install
export AG_CLOUD_INSTALL=1
exec ./tools/install-for-cloud.sh
