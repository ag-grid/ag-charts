#!/usr/bin/env bash
# rulesync-fetch: clone/update ag-dev-prompts into a local cache so non-Claude
# targets (Cursor, Codex, Gemini, Copilot, AGENTS.md) can receive plugin content
# via rulesync generate. Part of AG-17085 Phase 3.
#
# Auth precedence:
#   1. AG_DEV_PROMPTS_REPO env — explicit URL (overrides everything below)
#   2. AG_DEV_PROMPTS_TOKEN env — https clone with PAT (CI path)
#   3. GITHUB_TOKEN env        — same, using the default Actions token if it has
#                                access to the private repo (GitHub App / org PAT)
#   4. Fallback                 — SSH (git@github.com:...), the dev workstation path
set -euo pipefail

CACHE_ROOT="${AG_DEV_PROMPTS_CACHE:-$HOME/.cache/ag-dev-prompts}"
REF="${AG_DEV_PROMPTS_REF:-latest}"
REPO_DIR="$CACHE_ROOT/repo"
REPO_SLUG="${AG_DEV_PROMPTS_SLUG:-ag-grid/ag-dev-prompts}"

resolve_repo_url() {
    if [[ -n "${AG_DEV_PROMPTS_REPO:-}" ]]; then
        echo "$AG_DEV_PROMPTS_REPO"
        return
    fi
    local token="${AG_DEV_PROMPTS_TOKEN:-${GITHUB_TOKEN:-}}"
    if [[ -n "$token" ]]; then
        echo "https://x-access-token:${token}@github.com/${REPO_SLUG}.git"
        return
    fi
    echo "git@github.com:${REPO_SLUG}.git"
}

REPO_URL=$(resolve_repo_url)

mkdir -p "$CACHE_ROOT"

if [[ ! -d "$REPO_DIR/.git" ]]; then
    git clone --depth=1 --filter=blob:none --branch "$REF" "$REPO_URL" "$REPO_DIR" >&2
else
    # Update the remote URL in case auth changed between runs (e.g. token rotated).
    git -C "$REPO_DIR" remote set-url origin "$REPO_URL"
    git -C "$REPO_DIR" fetch --depth=1 --quiet origin "$REF" >&2
    git -C "$REPO_DIR" reset --hard --quiet FETCH_HEAD >&2
fi

# Emit the resolved SHA on stdout so callers can pin
(cd "$REPO_DIR" && git rev-parse HEAD)
