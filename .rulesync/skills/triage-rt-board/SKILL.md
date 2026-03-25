---
targets: ['*']
name: triage-rt-board
description: >-
    Triage an entire regression testing board end-to-end. Fetches ALL active
    tickets from a CRT (Charts) or RTI (Grid) board, runs /triage-rt on each,
    caches individual reports, cross-references related tickets, and produces a
    prioritised board summary with fix/defer determinations and assignee
    workload. Use when the user says "triage the board", "triage all CRT
    tickets", "regression board summary", "prioritise the release tickets",
    "what should we fix first", "release testing status", or any request to
    assess, summarise, or prioritise the full set of release testing tickets.
    Also invoke for board refresh, re-triage, or updated priority ordering.
    NOT for single-ticket triage (use /triage-rt for that). The distinguishing
    signal is whether the user wants a board-level view across multiple tickets
    vs. analysis of one specific ticket.
context: fork
---

# Regression Board Triage

Triage all active tickets on a regression testing board, producing a prioritised
summary with fix/defer determinations, cross-references, and assignee workload.

Individual ticket triage is delegated to the `/triage-rt` skill and cached in
`reports/triage-rt/<TICKET-ID>.md` so subsequent runs skip already-triaged
tickets.

## Step 0: Verify Prerequisites

1. Call `mcp__atlassian__atlassianUserInfo`. Hard stop if unavailable — the
   Atlassian MCP is required.

2. Determine the **product** from the user's input:

    - **Charts** → JIRA project `CRT`
    - **Grid** → JIRA project `RTI`
    - If not specified, check the current repo. If it contains
      `ag-charts-community`, default to Charts/CRT. If `ag-grid-community`,
      default to Grid/RTI. Ask if ambiguous.

3. Determine the **release context** from the current git branch (pattern
   `bX.Y.Z`). This is used in the board summary header.

4. Determine the **regression baseline** — the previous release branch (the
   version currently live in production):
    - If current is `bX.Y.0`, previous is `bX.(Y-1).0`
    - If current is `bX.Y.Z` where Z>0, previous is `bX.Y.0`
    - Verify with `git branch -r | grep <previous-branch>`
    - If not found, use the most recent release tag:
      `git tag --list 'vX.*' --sort=-v:refname | head -1`
    - This baseline is passed to every subagent so regression analysis compares
      against the last shipped version, not just `origin/latest`.

## Step 1: Fetch Active Tickets

Query JIRA for all open regression testing tickets:

```
mcp__atlassian__searchJiraIssuesUsingJql
project = <CRT|RTI> AND status not in (Done, Closed, Resolved)
```

Collect the list of ticket IDs and titles. Report the count to the user:

> Found N active tickets on the CRT board. Checking cache...

## Step 2: Check Cache

For each ticket ID, check whether a cached triage report already exists at:

```
reports/triage-rt/<TICKET-ID>.md
```

Partition tickets into two lists:

-   **Cached**: report file exists — read it and parse the frontmatter/content
-   **Uncached**: no report file — needs triage

Report cache status to the user:

> N tickets already triaged (cached). M tickets need triage.

### Cache Format

Each cached report is a markdown file with YAML frontmatter storing structured
fields for aggregation, followed by the full triage report body:

```markdown
---
ticket: CRT-XXXXX
title: 'Ticket title from JIRA'
category: Library | Docs | Example | Website
regression: Yes | No | Unknown
recommendation: Fix in release | Fix in release (with caution) | Defer to next release | Needs investigation | Duplicate
risk: Low | Medium | High | N/A
scope: Narrow | Moderate | Wide | N/A
prominence: Core | Common | Specialised | N/A
assignee: 'Name'
related_tickets: ['AG-XXXXX', 'CRT-YYYY']
triaged_at: '2026-03-20T14:30:00Z'
---

<full triage report body from /triage-rt>
```

### Force Refresh

If the user says "refresh", "re-triage", or "force" for specific tickets or the
whole board, delete the corresponding cached report(s) and re-triage them.

## Step 3: Triage Uncached Tickets

Launch agents in **waves of up to 5** to triage uncached tickets. Each agent
must explicitly invoke the `/triage-rt` skill via the `Skill` tool.

### Wave Execution

1. Take the next batch of up to 5 uncached tickets.
2. For each ticket in the batch, use the **Agent tool** to spawn a
   `general-purpose` subagent with this prompt:

    ```
    Triage JIRA ticket <TICKET-ID> for the <CRT|RTI> regression testing board.

    IMPORTANT — use the Skill tool to invoke the /triage-rt skill:
      Skill(skill: "triage-rt", args: "<TICKET-ID>")

    This loads the full triage workflow. Follow it completely (Steps 0–7).
    DO NOT skip or compress any steps. Every step produces information that
    the final report depends on.

    Context for the triage:
    - Regression baseline: <BASELINE> (the previous release).
      Compare <BASELINE>..HEAD, not origin/latest..HEAD.
    - Product: <Charts|Grid>
    - JIRA project: <CRT|RTI>

    ### Mandatory Tool Calls

    The skill workflow requires these tool calls at minimum. If you find
    yourself producing a report without having made all of them, you have
    skipped steps — go back and complete them.

    1. **JIRA fetch** (Step 1): `mcp__atlassian__getJiraIssue` to get the
       full ticket (title, description, comments, linked issues).
    2. **Git log** (Step 3): `git log --oneline <BASELINE>..HEAD -- <paths>`
       on the relevant source files to determine regression status.
    3. **Codebase search** (Step 4): `Grep` or `Glob` to identify the likely
       fix location, check class hierarchy, and assess scope/risk.
    4. **JIRA search** (Step 5): `mcp__atlassian__searchJiraIssuesUsingJql`
       to find duplicates and related tickets.
    5. **Git authorship** (Step 6): `git log --format='%an'` or `git blame`
       on the affected files to identify the suggested assignee.

    ### Report Quality Requirements

    After the skill produces the triage report, save it to:
      reports/triage-rt/<TICKET-ID>.md

    The saved file MUST include YAML frontmatter with these fields:
    - ticket, title, category, regression, recommendation, risk, scope,
      prominence, assignee, related_tickets, triaged_at

    Then include the full triage report body after the frontmatter.
    The body MUST contain ALL of these sections (from the /triage-rt Step 7
    template):

    - **Classification** — category, regression status, severity assessment
    - **Regression Analysis** — which commits/files were checked, what was
      found or not found, and the conclusion
    - **Library Impact** (if Library category) — affected area, feature
      prominence with rationale, scope of change with rationale, risk of
      change with rationale
    - **Suggested Assignee** — name(s) with git-based rationale
    - **Existing Tickets** — duplicates, related tickets, release scope
    - **Recommendation** — verdict with reasoning

    A report shorter than 200 words (excluding frontmatter) indicates
    skipped steps. Go back and complete the full workflow before saving.
    ```

    Launch all agents in the batch with a **single message** containing
    multiple Agent tool calls (so they run in parallel). Use
    `run_in_background: true` so you can report progress as each completes.

3. As agents complete, report progress:
   > Triaged CRT-XXXX (3/M complete)...

4. When the batch is done, launch the next wave. Repeat until all uncached
   tickets are triaged.

### Validation Gate

After each wave completes, spot-check the cached reports for quality:

1. Read each newly saved report file.
2. Verify it contains all required sections (Classification, Regression
   Analysis, Library Impact if applicable, Suggested Assignee, Existing
   Tickets, Recommendation).
3. Check the word count — reports under 200 words (excluding frontmatter)
   are too thin. Flag them for re-triage in the next wave.
4. If more than half the reports in a wave fail validation, pause and report
   the issue to the user before continuing — the sub-agents may not be
   executing the skill correctly.

### Error Handling

If an agent fails (e.g., JIRA fetch error, skill not found), note the ticket
and failure reason. Continue with remaining tickets. Report all failures at
the end — do not retry in the same run.

## Step 4: Cross-Ticket Analysis

Once all individual triages are complete (from cache + fresh runs), perform
board-level analysis:

### 4a. Cross-References

Compare the `related_tickets` fields across all board tickets to find:

-   **Shared root causes**: Multiple board tickets that reference the same
    upstream AG-XXXXX ticket or the same commits
-   **Same-area clusters**: Tickets affecting the same code area (e.g., two
    tooltip bugs, two axis issues)
-   **Duplicate candidates**: Board tickets that appear to be duplicates of
    each other (same root cause, different symptoms)

### 4b. Assignee Consolidation

Group tickets by suggested assignee to identify workload concentration. If one
person is suggested for many tickets, note this — the user may want to
redistribute or batch related fixes.

### 4c. Dependency Detection

Identify tickets where one fix may resolve or affect another:

-   A library fix that would also resolve an example ticket
-   Two tickets that touch the same file and could conflict if fixed separately

## Step 5: Prioritise

Place **every ticket into exactly one priority category**. No ticket should be
mentioned only in prose sections without also appearing in a category table row.
The overview metric counts must sum to the total ticket count — verify this
before finalising.

### Priority Categories (Descending Priority)

Tickets are ordered by category first, then filtered by feasibility within each
category. This reflects the release decision hierarchy: _what kind of issue is
it?_ determines attention priority; _can we fix it safely?_ determines the
action taken.

**Cat A — Library Regressions**
Bugs introduced since the previous release in library code (`ag-charts-community`,
`ag-charts-enterprise`, framework wrappers). Highest priority — shipping new
bugs degrades user trust and these must be addressed before release.

**Cat B — Library Core Non-Regressions**
Pre-existing bugs in core library features (axes, legend, titles/subtitles,
tooltips, bar/line/area/pie/donut series, gridlines, crosshairs, labels). These
features appear on most chart configurations, so bugs here affect the majority
of users.

**Cat C — Library Non-Core Non-Regressions**
Pre-existing bugs in common or specialised library features (scatter, bubble,
histogram, treemap, sunburst, sankey, navigator, zoom, etc.). Fewer users
affected.

**Cat D — Docs & Examples**
Documentation text errors, broken examples, incorrect API descriptions,
misleading guidance. These are deployed independently of library NPM publishes
and do not block the library release — they can ship on their own schedule.

**Cat E — Website**
Website infrastructure issues — broken links, styling problems, build failures,
navigation bugs. Lowest priority; also deployed independently of the library.

### Feasibility Filter

Within each category, assess whether the fix is feasible with acceptable risk
for the release timeline:

| Recommendation            | Criteria                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| **Fix in release**        | Scope and risk are acceptable. Straightforward change, well-tested. |
| **Fix with caution**      | Feasible but needs careful testing due to scope or risk.            |
| **Defer to next release** | Risk/scope too high, or fix too complex for this release cycle.     |

The feasibility filter determines the _action_ but does not change the
_category ordering_. A deferred Library Regression (Cat A) is still listed
before a fixable Docs issue (Cat D) — the category establishes priority for
resource allocation and attention.

### Cross-Cutting Dispositions

These apply across all categories and are listed after the main priority
categories:

**Needs Investigation** — Regression status unknown or root cause unclear.
List specific next steps to resolve the ambiguity.

**Duplicate / Close / Out of Scope** — Duplicates another board ticket or
existing AG-XXXXX ticket, or is an enhancement request. Note the action
(close, link, or move to backlog).

### Within-Category Ordering

Within each category, order tickets by:

1. **Fix** before **Fix with caution** before **Defer** (actionable items first)
2. **Lower risk** before **Higher risk** (easier/safer fixes first)
3. **Narrower scope** before **Wider scope**
4. For Cat A: **Core** prominence before **Common** before **Specialised**

## Step 6: Produce Board Summary

Output the board summary directly in the conversation AND save it to
`reports/triage-rt/board-summary.md`.

### Board Summary Template

```markdown
# Regression Board Triage: <release-branch> (<Product>)

_Generated: <date>_

## Overview

| Category                           | Count |
| ---------------------------------- | ----- |
| Total active tickets               | N     |
| **Cat A** — Library regressions    | X     |
| **Cat B** — Library core non-reg   | Y     |
| **Cat C** — Library non-core       | Z     |
| **Cat D** — Docs & examples        | D     |
| **Cat E** — Website                | W     |
| Needs investigation                | I     |
| Duplicates                         | U     |

| Action               | Count |
| -------------------- | ----- |
| → Fix in release     | F     |
| → Fix with caution   | C     |
| → Defer              | R     |

## Priority Order

### Cat A — Library Regressions

| #   | Ticket   | Title | Prominence  | Risk | Scope  | Recommendation     | Assignee |
| --- | -------- | ----- | ----------- | ---- | ------ | ------------------ | -------- |
| 1   | CRT-XXXX | ...   | Core        | Low  | Narrow | Fix in release     | Name     |

### Cat B — Library Core Non-Regressions

| #   | Ticket | Title | Risk | Scope  | Recommendation     | Assignee |
| --- | ------ | ----- | ---- | ------ | ------------------ | -------- |

### Cat C — Library Non-Core Non-Regressions

| #   | Ticket | Title | Prominence  | Risk | Scope  | Recommendation     | Assignee |
| --- | ------ | ----- | ----------- | ---- | ------ | ------------------ | -------- |

### Cat D — Docs & Examples

| #   | Ticket | Title | Recommendation     | Assignee |
| --- | ------ | ----- | ------------------ | -------- |

### Cat E — Website

| #   | Ticket | Title | Recommendation     | Assignee |
| --- | ------ | ----- | ------------------ | -------- |

### Needs Investigation

| #   | Ticket | Title | Category | Next Steps |
| --- | ------ | ----- | -------- | ---------- |

### Duplicate / Close

| #   | Ticket | Duplicate Of | Action |
| --- | ------ | ------------ | ------ |

## Cross-References

-   [Describe shared root causes, same-area clusters, dependency chains]

## Assignee Workload

| Assignee | Tickets       | Cat A | Cat B | Cat C | Cat D/E |
| -------- | ------------- | ----- | ----- | ----- | ------- |
| Name     | CRT-X, CRT-Y | 1     | 1     | 0     | 0       |

## Failures

[Any tickets that could not be triaged, with error details]
```

## Step 7: Apply Prioritisation to JIRA Board

After producing the board summary, offer to apply the priority ordering to the
JIRA board by updating issue rank. This requires the JIRA Agile REST API —
the Atlassian MCP tools **cannot** change rank (see `/jira` skill → "Ranking
Issues" for full details).

### 7a. Verify JIRA REST API Credentials

The Agile API requires direct REST API auth via environment variables, separate
from the Atlassian MCP OAuth connection.

```bash
source ~/.zshrc
curl -s -w "\nHTTP: %{http_code}" \
  "${JIRA_URL}/rest/api/3/myself" \
  -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}"
```

If this returns HTTP 200, proceed to 7b.

If it returns 401 or the env vars are missing, inform the user:

> JIRA REST API credentials are not available or have expired.
>
> To apply the board ranking, I need `JIRA_URL`, `JIRA_USERNAME`, and
> `JIRA_API_TOKEN` set in your shell environment.
>
> Generate a token at: https://id.atlassian.com/manage-profile/security/api-tokens
>
> Then add to `~/.zshrc`:
> ```
> export JIRA_URL="https://ag-grid.atlassian.net"
> export JIRA_USERNAME="your.email@ag-grid.com"
> export JIRA_API_TOKEN="your-token-here"
> ```

Do not proceed until auth is confirmed working.

### 7b. Rank All Tickets

Construct a single `PUT /rest/agile/1.0/issue/rank` call with all tickets
(up to 50) in the priority order from the board summary.

Strategy: place the first N−1 tickets before the last ticket using
`rankBeforeIssue`. The `issues` array preserves the listed order.

```bash
source ~/.zshrc
curl -s -o /dev/null -w "%{http_code}" -X PUT \
  "${JIRA_URL}/rest/agile/1.0/issue/rank" \
  -H 'Content-Type: application/json' \
  -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  -d '{
    "issues": ["CRT-first", "CRT-second", "...", "CRT-penultimate"],
    "rankBeforeIssue": "CRT-last",
    "rankCustomFieldId": 10120
  }'
```

Expected response: **204** = success.

### 7c. Verify

Confirm the new order with a JQL query:

```bash
source ~/.zshrc
curl -s "${JIRA_URL}/rest/api/3/search/jql" -G \
  --data-urlencode "jql=project = CRT AND key in (...) ORDER BY rank ASC" \
  --data-urlencode "fields=summary" \
  --data-urlencode "maxResults=50" \
  -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" | jq '[.issues[] | {key, summary: .fields.summary}]'
```

Report the verified order to the user.

---

### Verification Checklist

Before finalising the board summary, verify:

1. **Every ticket** from Step 1 appears in exactly one category table row
2. The **overview category counts** sum to the total ticket count
3. The **overview action counts** (Fix + Fix with caution + Defer + Investigation + Duplicate) sum to the total
4. The **Assignee Workload** ticket lists cover all tickets
5. Any ticket mentioned in **Borderline Calls** also appears in a category table

### Summary Principles

-   Lead with actionable information — Cat A (library regressions) first
-   The category ordering reflects release priority: library regressions are
    blockers, non-regression library bugs are important, docs/examples/website
    are independently releasable and do not block the NPM publish
-   The feasibility filter (fix/defer) is applied within each category — a
    deferred regression still appears before a fixable docs issue
-   The summary is a decision-support tool, not a decision-maker — the user
    makes the final calls
-   Flag any ticket where the recommendation is borderline or where you had
    low confidence — but still place it in a category
-   If two tickets share a root cause, note that fixing one may resolve the
    other — this affects effective workload
