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

# Track which auth path was selected so failure messages can be tailored.
# Set here (not inside the resolver) because resolve_repo_url runs inside a
# command substitution subshell, so assignments there wouldn't propagate.
if [[ -n "${AG_DEV_PROMPTS_REPO:-}" ]]; then
    AUTH_MODE="override"
elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
    AUTH_MODE="token"
else
    AUTH_MODE="ssh"
fi

# Git config args for the current invocation only. When GITHUB_TOKEN is set we
# attach an Authorization header via `-c http.extraHeader=...` instead of
# embedding credentials in the remote URL, so nothing secret lands in
# .git/config. Assignment happens at top level (not inside a subshell) so the
# array is visible to the git invocations below.
GIT_AUTH_ARGS=()
if [[ "$AUTH_MODE" == "token" ]]; then
    _basic=$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')
    GIT_AUTH_ARGS=(-c "http.extraHeader=Authorization: Basic ${_basic}")
    unset _basic
fi

resolve_repo_url() {
    case "$AUTH_MODE" in
        override) echo "$AG_DEV_PROMPTS_REPO" ;;
        token)    echo "https://github.com/${REPO_SLUG}.git" ;;
        ssh|*)    echo "git@github.com:${REPO_SLUG}.git" ;;
    esac
}

# Print tailored remediation to stderr based on which auth path we tried. Called
# from the ERR trap so developers see actionable next steps instead of a bare
# git error.
print_remediation() {
    local exit_code="$1"
    echo "" >&2
    echo "ag-dev-prompts fetch failed (exit $exit_code) from $REPO_URL" >&2
    echo "" >&2
    case "$AUTH_MODE" in
        ssh)
            cat >&2 <<EOF
Auth path: SSH (default for dev workstations).

To fix, pick one:

  A. Ensure your SSH key is registered with GitHub and has access to
     ag-grid/ag-dev-prompts:
       ssh -T git@github.com           # should greet you by username
       ssh-add -l                      # check a key is loaded

  B. Install GitHub CLI and authenticate, then export a token for this
     session (no .git/config persistence — GITHUB_TOKEN overrides SSH):
       brew install gh                 # or: https://cli.github.com/
       gh auth login --hostname github.com --git-protocol https --web
       export GITHUB_TOKEN=\$(gh auth token)
       yarn                            # re-run install to retry the fetch

  C. If you already have a Personal Access Token with repo scope:
       export GITHUB_TOKEN=ghp_...
       yarn

Verify access directly:
  git ls-remote git@github.com:${REPO_SLUG}.git
EOF
            ;;
        token)
            cat >&2 <<EOF
Auth path: GITHUB_TOKEN (likely CI, or you exported one locally).

Common causes:
  * Token expired or revoked.
  * Token missing 'repo' scope (private repo access required).
  * Token belongs to an account without access to ${REPO_SLUG}.

To fix:
  * CI: rotate the ${REPO_SLUG} read token in the repo/org secrets.
  * Local: re-authenticate with gh and refresh the token:
      gh auth refresh -h github.com -s repo
      export GITHUB_TOKEN=\$(gh auth token)
      yarn

Verify the token directly:
  curl -sSf -H "Authorization: Bearer \$GITHUB_TOKEN" https://api.github.com/repos/${REPO_SLUG} >/dev/null \\
    && echo "token OK" || echo "token rejected"
EOF
            ;;
        override)
            cat >&2 <<EOF
Auth path: AG_DEV_PROMPTS_REPO override (= $REPO_URL).

This URL was supplied via the AG_DEV_PROMPTS_REPO env var. Check that it
points at a reachable remote and that your current credentials (SSH key or
GITHUB_TOKEN) grant access. Unset the variable to fall back to the default
(${REPO_SLUG}):

  unset AG_DEV_PROMPTS_REPO
  yarn
EOF
            ;;
    esac
    echo "" >&2
    echo "After fixing, re-run: yarn   (or: ./external/ag-shared/scripts/setup-prompts/setup-prompts.sh)" >&2
    echo "" >&2
}

trap 'print_remediation $?' ERR

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
