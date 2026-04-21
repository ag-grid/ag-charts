#!/usr/bin/env bash
# rulesync-fetch: clone/update ag-dev-prompts into a local cache so non-Claude
# targets (Cursor, Codex, Gemini, Copilot, AGENTS.md) can receive plugin content
# via rulesync generate. Part of AG-17085 Phase 3.
#
# Auth precedence:
#   1. AG_DEV_PROMPTS_REPO env — explicit URL (overrides everything below)
#   2. GITHUB_TOKEN env        — https clone via per-call Authorization header
#                                (not persisted to .git/config). CI path.
#   3. Fallback                 — SSH (git@github.com:...), the dev workstation path
#
# AG_DEV_PROMPTS_REF must resolve to a branch or tag name. SHAs are not supported.
set -euo pipefail

CACHE_ROOT="${AG_DEV_PROMPTS_CACHE:-$HOME/.cache/ag-dev-prompts}"
REF="${AG_DEV_PROMPTS_REF:-latest}"
REPO_DIR="$CACHE_ROOT/repo"
REPO_SLUG="${AG_DEV_PROMPTS_SLUG:-ag-grid/ag-dev-prompts}"

# Git config args for the current invocation only. When GITHUB_TOKEN is set we
# attach an Authorization header via `-c http.extraHeader=...` instead of
# embedding credentials in the remote URL, so nothing secret lands in
# .git/config.
GIT_AUTH_ARGS=()
resolve_repo_url() {
    if [[ -n "${AG_DEV_PROMPTS_REPO:-}" ]]; then
        echo "$AG_DEV_PROMPTS_REPO"
        return
    fi
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        local basic
        basic=$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')
        GIT_AUTH_ARGS=(-c "http.extraHeader=Authorization: Basic ${basic}")
        echo "https://github.com/${REPO_SLUG}.git"
        return
    fi
    echo "git@github.com:${REPO_SLUG}.git"
}

REPO_URL=$(resolve_repo_url)

mkdir -p "$CACHE_ROOT"

if [[ ! -d "$REPO_DIR/.git" ]]; then
    git "${GIT_AUTH_ARGS[@]}" clone --depth=1 --filter=blob:none --branch "$REF" "$REPO_URL" "$REPO_DIR" >&2
else
    # Keep the remote URL in sync (no credentials embedded) in case the slug or
    # AG_DEV_PROMPTS_REPO changed between runs.
    git -C "$REPO_DIR" remote set-url origin "$REPO_URL"
    git "${GIT_AUTH_ARGS[@]}" -C "$REPO_DIR" fetch --depth=1 --quiet origin "$REF" >&2
    git -C "$REPO_DIR" reset --hard --quiet FETCH_HEAD >&2
fi

# Emit the resolved SHA on stdout so callers can pin
(cd "$REPO_DIR" && git rev-parse HEAD)
