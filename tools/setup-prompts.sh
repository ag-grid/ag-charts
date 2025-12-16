#!/bin/bash
# tools/setup-prompts.sh - Smart prompts setup for ag-charts
#
# This script handles detection and user prompts before delegating to the
# actual setup script in ag-charts-prompts.

set -euo pipefail

PROMPTS_REPO="git@github.com:ag-grid/ag-charts-prompts.git"

# Detect if we're in a git worktree and find the main repo
# In a worktree, .git is a file containing "gitdir: /path/to/main/.git/worktrees/name"
get_main_repo_root() {
    local git_path=".git"

    if [[ -f "$git_path" ]]; then
        # We're in a worktree - parse the gitdir to find main repo
        local gitdir
        gitdir=$(cat "$git_path" | sed 's/gitdir: //')
        # gitdir is like /path/to/main/.git/worktrees/name
        # Go up twice to get /path/to/main/.git, then dirname for main repo
        local main_git_dir
        main_git_dir=$(dirname "$(dirname "$gitdir")")
        dirname "$main_git_dir"
    else
        # Normal checkout - current directory is the repo root
        pwd
    fi
}

# Detect if we're in a worktree
is_worktree() {
    [[ -f ".git" ]]
}

# Get the main repo root (handles worktrees)
MAIN_REPO_ROOT=$(get_main_repo_root)

# Prompts directory is always adjacent to the MAIN repo, not the worktree
PROMPTS_DIR="$MAIN_REPO_ROOT/../ag-charts-prompts"

# Detect CI environment
is_ci() {
    [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" || -n "${JENKINS_URL:-}" || -n "${BUILDKITE:-}" || -n "${CIRCLECI:-}" || -n "${TRAVIS:-}" ]]
}

# Detect if running in interactive terminal
is_interactive() {
    [[ -t 0 ]]
}

# Detect if user has agentic tools installed
has_agentic_tools() {
    command -v claude >/dev/null 2>&1 || \
    command -v cursor >/dev/null 2>&1 || \
    command -v gemini >/dev/null 2>&1 || \
    command -v codex >/dev/null 2>&1
}

# Check if user has access to the prompts repo
has_repo_access() {
    git ls-remote "$PROMPTS_REPO" HEAD >/dev/null 2>&1
}

# Check if prompts checkout is clean (no uncommitted changes)
is_checkout_clean() {
    (cd "$PROMPTS_DIR" && [[ -z "$(git status --porcelain)" ]])
}

# Check if prompts checkout is behind remote
is_checkout_behind() {
    (
        cd "$PROMPTS_DIR"
        git fetch origin --quiet 2>/dev/null || return 1
        local LOCAL=$(git rev-parse HEAD)
        local REMOTE=$(git rev-parse origin/latest 2>/dev/null || git rev-parse origin/main 2>/dev/null || echo "")
        [[ -n "$REMOTE" && "$LOCAL" != "$REMOTE" ]]
    )
}

# Prompt user with default yes, or auto-yes in non-interactive mode
prompt_yes_no() {
    local message="$1"
    if ! is_interactive; then
        # Non-interactive: auto-yes
        return 0
    fi
    read -p "$message [Y/n] " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Nn]$ ]]
}

# Main logic
main() {
    # Skip in CI
    if is_ci; then
        echo "Skipping prompts setup (CI environment)"
        return 0
    fi

    # If prompts dir exists, check for updates and run setup
    # (bypass agentic tools check - user explicitly cloned the repo)
    if [[ -d "$PROMPTS_DIR" ]]; then
        if is_checkout_clean && is_checkout_behind; then
            echo "ag-charts-prompts is out of date."
            if prompt_yes_no "Update now?"; then
                echo "Updating ag-charts-prompts..."
                (cd "$PROMPTS_DIR" && git pull --ff-only)
            fi
        fi
        # In worktrees, create a symlink in the parent directory pointing to the real prompts
        # This allows the version-controlled relative symlink (../../ag-charts-prompts) to work
        if is_worktree; then
            local worktree_parent
            worktree_parent=$(dirname "$(pwd)")
            local parent_prompts_link="$worktree_parent/ag-charts-prompts"
            local real_prompts
            real_prompts=$(cd "$PROMPTS_DIR" && pwd)

            if [[ ! -e "$parent_prompts_link" ]]; then
                echo "Creating prompts symlink in worktree parent: $parent_prompts_link -> $real_prompts"
                ln -sf "$real_prompts" "$parent_prompts_link"
            elif [[ -L "$parent_prompts_link" ]]; then
                local current_target
                current_target=$(readlink "$parent_prompts_link")
                if [[ "$current_target" != "$real_prompts" ]]; then
                    echo "Updating prompts symlink in worktree parent: $parent_prompts_link -> $real_prompts"
                    ln -sf "$real_prompts" "$parent_prompts_link"
                fi
            fi
        fi
        # Run the actual setup script
        "$PROMPTS_DIR/setup-prompts.sh"
        return 0
    fi

    # Prompts dir doesn't exist - only offer to clone if agentic tools detected
    if ! has_agentic_tools; then
        echo "Skipping prompts setup (no agentic tools detected)"
        return 0
    fi

    # Check repo access before offering to clone
    if ! has_repo_access; then
        echo "Skipping prompts setup (no access to ag-charts-prompts repo)"
        return 0
    fi

    echo "ag-charts-prompts not found at $PROMPTS_DIR"
    if prompt_yes_no "Clone it now?"; then
        echo "Cloning ag-charts-prompts..."
        git clone "$PROMPTS_REPO" "$PROMPTS_DIR"
        # In worktrees, create parent symlink (same logic as above)
        if is_worktree; then
            local worktree_parent
            worktree_parent=$(dirname "$(pwd)")
            local parent_prompts_link="$worktree_parent/ag-charts-prompts"
            local real_prompts
            real_prompts=$(cd "$PROMPTS_DIR" && pwd)
            if [[ ! -e "$parent_prompts_link" ]]; then
                echo "Creating prompts symlink in worktree parent: $parent_prompts_link -> $real_prompts"
                ln -sf "$real_prompts" "$parent_prompts_link"
            fi
        fi
        "$PROMPTS_DIR/setup-prompts.sh"
    else
        echo "Skipping prompts setup"
    fi
}

main "$@"
