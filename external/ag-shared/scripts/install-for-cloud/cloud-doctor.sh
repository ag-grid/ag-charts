#!/usr/bin/env bash
# external/ag-shared/scripts/install-for-cloud/cloud-doctor.sh
#
# Readiness report for a Claude Code session — written for cloud sessions, but
# safe to run anywhere. Answers "is this session actually ready to work?" and,
# when it is not, which layer is missing: toolchain, dependencies, generated
# Claude Code config, or plugin-delivered skills.
#
# Ask Claude to run it in a cloud session:
#   bash external/ag-shared/scripts/install-for-cloud/cloud-doctor.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"
if [[ -z "${AG_CLOUD_CACHE_DIR:-}" ]]; then
    # Matches install-for-cloud.sh: the shared path first, $HOME only as fallback.
    if [[ -d /opt/ag-cloud ]]; then
        AG_CLOUD_CACHE_DIR=/opt/ag-cloud
    else
        AG_CLOUD_CACHE_DIR="$HOME/.cache/ag-cloud"
    fi
fi

CANARY_SKILLS=(example dev-server debug-trace git-conventions jira)
FAILURES=0

ok() { echo "  ✓ $*"; }
bad() {
    echo "  ✗ $*"
    FAILURES=$((FAILURES + 1))
}
note() { echo "  · $*"; }

echo "=== Claude Code session readiness ==="
echo
echo "environment"
note "repo root:       ${REPO_ROOT}"
note "cloud session:   ${CLAUDE_CODE_REMOTE:-false}"
note "session id:      ${CLAUDE_CODE_REMOTE_SESSION_ID:-n/a}"
note "branch:          $(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"

echo
echo "toolchain"
wanted_node="$(tr -d 'v \t\n' <"$REPO_ROOT/.nvmrc" 2>/dev/null)"
have_node="$(node -v 2>/dev/null | tr -d 'v')"
if [[ -z "$have_node" ]]; then
    bad "node not on PATH"
elif [[ "$have_node" == "$wanted_node" ]]; then
    ok "node ${have_node} (matches .nvmrc)"
else
    bad "node ${have_node} but .nvmrc wants ${wanted_node:-?}"
fi
if command -v yarn &>/dev/null; then ok "yarn $(yarn -v 2>/dev/null)"; else bad "yarn not on PATH"; fi
if command -v nx &>/dev/null; then ok "nx on PATH"; else note "nx not global — use \`yarn nx\`"; fi
if command -v gh &>/dev/null; then
    ok "gh $(gh --version 2>/dev/null | head -1 | awk '{print $3}')"
else
    note "gh not installed (built-in GitHub tools still work)"
fi

echo
echo "dependencies"
if [[ -d "$REPO_ROOT/node_modules" ]]; then
    if (cd "$REPO_ROOT" && yarn check --integrity &>/dev/null); then
        ok "node_modules present and in sync with yarn.lock"
    else
        bad "node_modules present but stale — an install is pending"
    fi
else
    bad "node_modules missing"
fi
if [[ -d "$AG_CLOUD_CACHE_DIR/node_modules" ]]; then
    ok "cloud cache seeded ($AG_CLOUD_CACHE_DIR)"
else
    note "no cloud cache — a re-cloned tree would need a full install"
fi

echo
echo "claude code config"
if [[ -f "$REPO_ROOT/.claude/settings.json" ]]; then
    ok ".claude/settings.json (hooks, permissions, plugins)"
else
    bad ".claude/settings.json missing — no hooks, no plugins, no skills"
fi
if [[ -f "$REPO_ROOT/CLAUDE.md" ]]; then ok "CLAUDE.md"; else bad "CLAUDE.md missing"; fi
rules_count=$(find "$REPO_ROOT/.claude/rules" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$rules_count" -gt 0 ]]; then
    ok ".claude/rules (${rules_count} generated rules)"
else
    note ".claude/rules empty — rulesync has not run in this tree"
fi

echo
echo "plugin marketplaces"
for market in ag-dev openai-codex; do
    dir="$HOME/.claude/plugins/marketplaces/$market"
    if [[ -d "$dir" ]]; then ok "${market} cloned"; else bad "${market} not installed"; fi
done

echo
echo "skills (canary set)"
for skill in "${CANARY_SKILLS[@]}"; do
    if find "$HOME/.claude/plugins/marketplaces" "$HOME/.claude/plugins/cache" \
        "$REPO_ROOT/.claude/skills" -maxdepth 6 -type d -name "$skill" 2>/dev/null | grep -q .; then
        ok "$skill"
    else
        bad "$skill missing"
    fi
done

echo
if ((FAILURES == 0)); then
    echo "READY — no gaps found."
else
    echo "NOT READY — ${FAILURES} gap(s) above."
    echo "Cloud sessions: check the environment's setup script (see"
    echo "external/ag-shared/docs/claude-code-cloud-sessions.md); locally run \`yarn\`."
fi
exit 0
