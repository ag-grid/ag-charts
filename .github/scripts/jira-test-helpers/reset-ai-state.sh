#!/usr/bin/env bash
# Reset the AI* state on a Jira ticket so consecutive workflow dispatches start
# from the same baseline. Clears every AI* field EXCEPT AI Cost (cumulative),
# and removes any attachment whose filename matches a /fr --ci state-file name.
#
# Usage:
#   JIRA_USER_EMAIL=... JIRA_API_TOKEN=... ./reset-ai-state.sh AG-17421
#
# Optional env:
#   JIRA_SITE_URL    defaults to https://ag-grid.atlassian.net
#   KEEP_COST        if set to "0", also resets AI Cost to 0.
#   DRY_RUN          if set to "1", prints the plan but doesn't write.

set -euo pipefail

ISSUE_KEY="${1:?usage: reset-ai-state.sh <ISSUE_KEY>}"
: "${JIRA_USER_EMAIL:?missing}"
: "${JIRA_API_TOKEN:?missing}"
SITE="${JIRA_SITE_URL:-https://ag-grid.atlassian.net}"
SITE="${SITE%/}"
AUTH="$(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64 | tr -d '\n')"
DRY_RUN="${DRY_RUN:-0}"

STATE_FILES=(intent.md research.md plan.md decisions.md progress.md review-feedback.md)

echo "[reset] Ticket: $ISSUE_KEY"

# ----- field reset (v2 to keep ADF out of the picture) ----------------------
FIELDS_JSON='{"fields":{
    "customfield_10942": null,
    "customfield_10943": null,
    "customfield_10944": null,
    "customfield_10945": null,
    "customfield_10946": null,
    "customfield_10947": null,
    "customfield_10948": null
}}'
if [[ "${KEEP_COST:-1}" == "0" ]]; then
    FIELDS_JSON=$(echo "$FIELDS_JSON" | jq '.fields.customfield_10941 = 0')
fi
echo "[reset] Will clear: $(echo "$FIELDS_JSON" | jq -r '.fields | keys | join(", ")')"

if [[ "$DRY_RUN" == "0" ]]; then
    HTTP=$(curl -sS -o /tmp/reset-fields.out -w '%{http_code}' \
        -X PUT \
        -H "authorization: Basic $AUTH" \
        -H 'accept: application/json' \
        -H 'content-type: application/json' \
        --data "$FIELDS_JSON" \
        "$SITE/rest/api/2/issue/$ISSUE_KEY")
    if [[ "$HTTP" != "204" && "$HTTP" != "200" ]]; then
        echo "[reset] field PUT failed: HTTP $HTTP" >&2
        cat /tmp/reset-fields.out >&2 || true
        exit 1
    fi
    echo "[reset] fields cleared"
else
    echo "[reset] DRY_RUN — field PUT skipped"
fi

# ----- attachment cleanup ---------------------------------------------------
ATT_JSON=$(curl -sS -H "authorization: Basic $AUTH" -H 'accept: application/json' \
    "$SITE/rest/api/3/issue/$ISSUE_KEY?fields=attachment")
COUNT_BEFORE=$(echo "$ATT_JSON" | jq '.fields.attachment | length')
echo "[reset] $COUNT_BEFORE attachment(s) on ticket"

# build the list of state-file ids
TO_DELETE=$(echo "$ATT_JSON" | jq --argjson names "$(printf '%s\n' "${STATE_FILES[@]}" | jq -R . | jq -s .)" \
    '[.fields.attachment[] | select(.filename as $n | $names | index($n)) | {id, filename}]')
N=$(echo "$TO_DELETE" | jq 'length')
echo "[reset] $N attachment(s) match state-file names:"
echo "$TO_DELETE" | jq -r '.[] | "  - \(.id)  \(.filename)"'

if [[ "$DRY_RUN" == "1" ]]; then
    echo "[reset] DRY_RUN — attachment deletes skipped"
    exit 0
fi

for ID in $(echo "$TO_DELETE" | jq -r '.[].id'); do
    HTTP=$(curl -sS -o /dev/null -w '%{http_code}' \
        -X DELETE \
        -H "authorization: Basic $AUTH" \
        "$SITE/rest/api/3/attachment/$ID")
    if [[ "$HTTP" != "204" ]]; then
        echo "[reset] attachment $ID DELETE returned HTTP $HTTP" >&2
    else
        echo "[reset] deleted attachment $ID"
    fi
done

echo "[reset] done"
