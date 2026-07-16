#!/usr/bin/env bash
# A/B eval: does the trimmed/re-scoped rule set degrade agent output quality, and does it
# reduce token spend? Runs headless Claude Code sessions in isolated worktrees per
# (model x task x condition x rep) cell, captures usage stats, grades the diff.
#
# Conditions:
#   baseline  — rules as produced by a clean setup-prompts.sh run at the worktree's HEAD
#               (i.e. upstream ag-dev-prompts canary + tracked .rulesync content at HEAD)
#   modified  — the main checkout's current generated .claude/rules (the candidate rule set)
#
# Usage:
#   tools/agentic-eval/run-eval.sh [--models "sonnet,opus"] [--tasks "t1,t2,t3"] [--reps 2] \
#                                  [--conditions "baseline,modified"] [--out reports/agentic-eval]
#
# Requirements: claude CLI on PATH; yarn; enough disk for one worktree per concurrent run.
# Runs cells sequentially to keep results comparable (no resource contention).

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
EVAL_DIR="$REPO_ROOT/tools/agentic-eval"
MODELS="sonnet,opus"
TASKS="t1,t2,t3"
CONDITIONS="baseline,modified"
REPS=2
OUT="$REPO_ROOT/reports/agentic-eval/$(date +%Y%m%d-%H%M%S)"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --models) MODELS="$2"; shift 2 ;;
        --tasks) TASKS="$2"; shift 2 ;;
        --conditions) CONDITIONS="$2"; shift 2 ;;
        --reps) REPS="$2"; shift 2 ;;
        --out) OUT="$2"; shift 2 ;;
        *) echo "unknown arg: $1" >&2; exit 1 ;;
    esac
done

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd) # absolute — cells cd into worktrees
echo "results -> $OUT"

# Snapshot the candidate rule set once, so later edits in the main checkout don't skew reps
# (and so a resumed run reuses the same snapshot).
MODIFIED_RULES="$OUT/rules-modified"
[[ -d "$MODIFIED_RULES" ]] || cp -R "$REPO_ROOT/.claude/rules" "$MODIFIED_RULES"

resolve_task_file() {
    local t="$1"
    ls "$EVAL_DIR/tasks/$t"-*.md 2>/dev/null | head -1
}

run_cell() {
    local model="$1" task="$2" condition="$3" rep="$4"
    local cell="${model}_${task}_${condition}_r${rep}"
    local wt="$REPO_ROOT/../ag-charts-eval-$cell"
    local task_file
    task_file=$(resolve_task_file "$task")
    [[ -n "$task_file" ]] || { echo "no task file for $task" >&2; return 1; }

    echo "=== $cell"
    git -C "$REPO_ROOT" worktree add --detach "$wt" HEAD >/dev/null

    (
        cd "$wt"
        # Install + generate baseline rules (setup-prompts runs as part of postinstall).
        yarn install > "$OUT/$cell.install.log" 2>&1

        if [[ "$condition" == "modified" ]]; then
            rm -rf .claude/rules
            cp -R "$MODIFIED_RULES" .claude/rules
        fi

        # Headless agent run. Scoped tool allowlist: file edits plus the build/test
        # commands the tasks require — no blanket permission bypass.
        claude -p "$(cat "$task_file")" \
            --model "$model" \
            --output-format json \
            --allowedTools "Read,Grep,Glob,Edit,Write,MultiEdit,TodoWrite,Bash(yarn:*),Bash(npx vitest:*),Bash(npx playwright:*),Bash(npx prettier:*),Bash(node:*),Bash(ls:*),Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(grep:*),Bash(find:*),Bash(cat:*)" \
            > "$OUT/$cell.result.json" 2> "$OUT/$cell.stderr.log" || true

        git add -A
        git diff HEAD > "$OUT/$cell.diff"
        git status --short > "$OUT/$cell.status"
    )

    # Kill anything the cell's agent left running (dev servers, watchers reference the
    # worktree path in argv; playwright e2e containers are named) so later cells start clean.
    pkill -f "$wt" 2>/dev/null || true
    if command -v docker >/dev/null 2>&1; then
        docker ps -aq --filter "name=playwright-e2e-" 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1 || true
    fi

    # `worktree remove --force` can refuse on stray nested dirs (e.g. browser caches);
    # the worktree is disposable, so fall back to rm + prune rather than aborting the run.
    git -C "$REPO_ROOT" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    git -C "$REPO_ROOT" worktree prune
}

judge_cell() {
    local cell="$1"
    [[ -s "$OUT/$cell.diff" ]] || { echo '{"scores":null,"notes":"empty diff"}' > "$OUT/$cell.judge.json"; return; }
    claude -p "$(cat "$EVAL_DIR/judge-prompt.md")

## Task
$(cat "$2")

## Diff
\`\`\`diff
$(head -c 150000 "$OUT/$cell.diff")
\`\`\`" \
        --model opus --output-format text \
        > "$OUT/$cell.judge.json" 2>/dev/null || true
}

IFS=',' read -ra M <<< "$MODELS"
IFS=',' read -ra T <<< "$TASKS"
IFS=',' read -ra C <<< "$CONDITIONS"

for model in "${M[@]}"; do
    for task in "${T[@]}"; do
        for condition in "${C[@]}"; do
            for rep in $(seq 1 "$REPS"); do
                cell="${model}_${task}_${condition}_r${rep}"
                run_cell "$model" "$task" "$condition" "$rep"
                judge_cell "$cell" "$(resolve_task_file "$task")"
            done
        done
    done
done

node "$EVAL_DIR/summarise-eval.mjs" "$OUT"
