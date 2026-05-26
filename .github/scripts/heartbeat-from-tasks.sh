#!/usr/bin/env bash
# PostToolUse hook: derive a heartbeat.jsonl line from TaskCreate /
# TaskUpdate events and append it to the live progress stream.
#
# The workflow's jira-progress-tail action tails heartbeat.jsonl and
# posts step/total*100 to the ticket's `AI progress` field and the
# label to `AI activity`. This hook is what makes those fields fill
# in for free — the agent just uses TaskCreate / TaskUpdate as it
# normally would, and progress telemetry follows.
#
# Event JSON arrives on stdin:
#
#   {
#     "session_id":   "...",
#     "tool_name":    "TaskCreate" | "TaskUpdate",
#     "tool_input":   { subject?, description?, taskId?, status?, ... },
#     "tool_response": { ... }
#   }
#
# State lives in <STATE_DIR>/.task-counters.json:
#
#   {
#     "total":     N,
#     "completed": M,
#     "subjects":  { "<task_id>": "<subject>", ... }
#   }
#
# Both files are workspace-relative — the hook resolves STATE_DIR
# from the HEARTBEAT_STATE_DIR env var that the workflow sets on the
# claude-code-action step. If unset (local invocation, or env not
# propagated for some reason), the hook no-ops with a friendly log
# line — never fails the agent.

set -euo pipefail

STATE_DIR="${HEARTBEAT_STATE_DIR:-}"
if [[ -z "$STATE_DIR" ]]; then
    echo "[heartbeat-hook] HEARTBEAT_STATE_DIR unset; skipping" >&2
    exit 0
fi

mkdir -p "$STATE_DIR"
COUNTERS="$STATE_DIR/.task-counters.json"
HEARTBEAT="$STATE_DIR/heartbeat.jsonl"

if [[ ! -f "$COUNTERS" ]]; then
    echo '{"total":0,"completed":0,"subjects":{}}' > "$COUNTERS"
fi

# stdin is the event payload. `cat` once, reuse.
EVENT="$(cat)"
if [[ -z "$EVENT" ]]; then
    echo "[heartbeat-hook] empty stdin; skipping" >&2
    exit 0
fi

TOOL=$(echo "$EVENT" | jq -r '.tool_name // empty')
case "$TOOL" in
    TaskCreate)
        SUBJECT=$(echo "$EVENT" | jq -r '.tool_input.subject // .tool_input.description // ""')
        # Some Task tool shapes return the new task id under tool_response.taskId or .id.
        NEW_ID=$(echo "$EVENT" | jq -r '.tool_response.taskId // .tool_response.id // empty')
        UPDATED=$(jq --arg id "$NEW_ID" --arg subj "$SUBJECT" '
            .total += 1
            | if ($id | length) > 0 then .subjects[$id] = $subj else . end
        ' "$COUNTERS")
        echo "$UPDATED" > "$COUNTERS"
        TOTAL=$(echo "$UPDATED" | jq '.total')
        COMPLETED=$(echo "$UPDATED" | jq '.completed')
        LABEL="Task created: ${SUBJECT}"
        ;;
    TaskUpdate)
        TASK_ID=$(echo "$EVENT" | jq -r '.tool_input.taskId // empty')
        NEW_STATUS=$(echo "$EVENT" | jq -r '.tool_input.status // empty')
        # If status field absent, this is a non-status edit — ignore.
        if [[ -z "$NEW_STATUS" ]]; then
            exit 0
        fi
        # Look up the task's subject for a nicer label.
        SUBJECT=$(jq -r --arg id "$TASK_ID" '.subjects[$id] // ""' "$COUNTERS")
        UPDATED="$(cat "$COUNTERS")"
        if [[ "$NEW_STATUS" == "completed" ]]; then
            UPDATED=$(echo "$UPDATED" | jq '.completed += 1')
            echo "$UPDATED" > "$COUNTERS"
        fi
        TOTAL=$(echo "$UPDATED" | jq '.total')
        COMPLETED=$(echo "$UPDATED" | jq '.completed')
        if [[ -n "$SUBJECT" ]]; then
            LABEL="${NEW_STATUS}: ${SUBJECT}"
        else
            LABEL="Task ${TASK_ID:-?}: ${NEW_STATUS}"
        fi
        ;;
    *)
        # Hook matcher should have filtered, but be defensive.
        exit 0
        ;;
esac

# `total` is always ≥ 1 here (we just bumped it on TaskCreate, or this
# is an update against an existing task). Be defensive.
if (( TOTAL < 1 )); then TOTAL=1; fi

# Emit the heartbeat line.
jq -nc \
    --argjson step "$COMPLETED" \
    --argjson total "$TOTAL" \
    --arg label "$LABEL" \
    --arg tool "$TOOL" \
    '{step:$step, total:$total, label:$label, tool:$tool}' \
    >> "$HEARTBEAT"
