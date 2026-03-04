#!/usr/bin/env bash
#
# setup-hooks.sh - Configure git hooksPath to use ag-shared hooks
#
# Sets core.hooksPath to point at this directory so shared git hooks
# (pre-commit, pre-push, etc.) are used for the repository.
# Preserves any previously configured hooksPath so hooks can be chained.
#
# Usage:
#   ./setup-hooks.sh   # Run directly or via postinstall:setup-git-hooks
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Detect CI environment
is_ci() {
    [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" || -n "${JENKINS_URL:-}" || -n "${BUILDKITE:-}" || -n "${CIRCLECI:-}" || -n "${TRAVIS:-}" ]]
}

# Get the main repo root (handles worktrees)
# In a worktree, .git is a file containing "gitdir: /path/to/main/.git/worktrees/name"
get_main_repo_root() {
    local git_path="$REPO_ROOT/.git"

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
        echo "$REPO_ROOT"
    fi
}

# Skip in CI — hook configuration is a local developer setup concern
if is_ci; then
    exit 0
fi

# Hooks directory must exist before we point git at it
if [[ ! -d "$SCRIPT_DIR" ]]; then
    exit 0
fi

MAIN_REPO_ROOT=$(get_main_repo_root)

current_hooks=$(git -C "$MAIN_REPO_ROOT" config core.hooksPath 2>/dev/null || true)

# Already configured to our hooks directory — nothing to do
if [[ "$current_hooks" == "$SCRIPT_DIR" ]]; then
    exit 0
fi

# Preserve any existing hooksPath so _run-hook-chain.sh can dispatch to it
if [[ -n "$current_hooks" ]]; then
    git -C "$MAIN_REPO_ROOT" config core.ag-shared.previousHooksPath "$current_hooks"
fi

git -C "$MAIN_REPO_ROOT" config core.hooksPath "$SCRIPT_DIR"
