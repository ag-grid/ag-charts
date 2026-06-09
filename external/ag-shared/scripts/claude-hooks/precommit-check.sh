#!/usr/bin/env bash
# external/ag-shared/scripts/claude-hooks/precommit-check.sh
#
# Claude Code PreToolUse hook (matcher: Bash). A read-only gate: when the Bash
# command is a `git commit` (incl. `--amend`, and chained forms like
# `git add -A && git commit ...`), it checks whether the staged, formattable
# files are already prettier-formatted. If any are not, it DENIES the commit
# with an actionable message so the model formats + re-stages + re-commits.
#
# It never mutates files, never stages, never stashes. The model performs the
# actual formatting through its own tool call, keeping its view in sync.
#
# Reads hook JSON on stdin: { "tool_input": { "command": "..." }, "cwd": "...", ... }

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
source "$SCRIPT_DIR/_common.sh"

# Allow the tool call to proceed under the normal permission flow (no JSON).
allow() { exit 0; }

# Deny the tool call and hand the reason to the model.
deny() {
    jq -n --arg r "$1" \
        '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
}

INPUT=$(cat 2>/dev/null || true)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || true)
[ -n "$CMD" ] || allow

# Act only on real git commits — not `git commit-tree`, not `--dry-run`.
printf '%s' "$CMD" | grep -Eq '(^|[^[:alnum:]_-])git[[:space:]]+commit([[:space:]]|$)' || allow
printf '%s' "$CMD" | grep -Eq 'commit-tree|--dry-run' && allow

ROOT=$(git -C "${CWD:-.}" rev-parse --show-toplevel 2>/dev/null) || allow
cd "$ROOT" || allow

# Staged, formattable files.
mapfile -t STAGED < <(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | while IFS= read -r f; do
    ch_is_formattable "$f" && printf '%s\n' "$f"
done)
[ "${#STAGED[@]}" -gt 0 ] || allow

export NX_DAEMON=false
CSV=$(IFS=,; printf '%s' "${STAGED[*]}")

# Read-only formatting check. Exit 0 → already formatted. Benign "no files
# matched" (root configs nx can't map) is treated as already-OK, not a block.
if yarn nx format:check --files "$CSV" >/tmp/.ch-precommit.$$ 2>&1; then
    rm -f "/tmp/.ch-precommit.$$"
    allow
fi
if grep -q "No files matching the pattern were found" "/tmp/.ch-precommit.$$" 2>/dev/null; then
    rm -f "/tmp/.ch-precommit.$$"
    allow
fi
rm -f "/tmp/.ch-precommit.$$"

# Staged files need formatting → block with a concrete fix.
deny "Staged files are not formatted. Run: \`yarn nx format --files ${CSV} && git add ${STAGED[*]}\` then re-commit. (auto-format pre-commit gate)"
