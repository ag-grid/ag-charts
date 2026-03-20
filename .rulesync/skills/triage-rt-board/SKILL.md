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

For each uncached ticket, spawn a subagent to perform individual triage. Launch
subagents in parallel (up to 5 at a time to avoid overwhelming JIRA).

Each subagent receives these instructions:

```
You are triaging a single JIRA ticket for a regression testing board.

1. Read the triage-rt skill at: .rulesync/skills/triage-rt/SKILL.md
2. Follow its complete workflow (Steps 0-7) for ticket: <TICKET-ID>
3. IMPORTANT: The regression baseline is <BASELINE> (the previous release).
   Use this as the comparison point in Step 3 (regression analysis) and
   Step 6 (assignee identification). Compare `<BASELINE>..HEAD` not
   `origin/latest..HEAD`.
4. After producing the triage report, save it to:
   reports/triage-rt/<TICKET-ID>.md

The saved file MUST include YAML frontmatter with these fields:
- ticket, title, category, regression, recommendation, risk, scope,
  prominence, assignee, related_tickets, triaged_at

Then include the full triage report body after the frontmatter.
```

As subagents complete, report progress:

> Triaged CRT-XXXX (3/M complete)...

If a subagent fails (e.g., JIRA fetch error), note it and continue with the
remaining tickets. Report failures at the end.

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

Place **every ticket into exactly one priority tier**. No ticket should be
mentioned only in prose sections (like "Borderline Calls") without also
appearing in a tier table row. The overview metric counts must sum to the total
ticket count — verify this before finalising.

### Priority Tiers

**P1 — Fix in Release**
Regressions with narrow scope and low/medium risk. Non-library fixes (example,
docs, website) that are trivially safe. These should be fixed before release.

**P2 — Fix in Release (with Caution)**
Regressions with moderate scope or medium/high risk. Pre-existing issues with
narrow scope AND low risk that are worth including. Need careful testing.

**P3 — Defer to Next Release**
Pre-existing issues with wide scope or high risk. Any fix where the release
risk outweighs the benefit.

**P4 — Needs Investigation**
Regression status unknown, or root cause unclear. Specific next steps should
be listed.

**P5 — Duplicate / Close / Out of Scope**
Tickets that duplicate other board tickets, existing AG-XXXXX tickets, or are
enhancement requests rather than bugs. Note the action (close, link, or move
to backlog).

### Within-Tier Ordering

Within each tier, order by:

1. **Regression** before **Pre-existing**
2. **Core** prominence before **Common** before **Specialised**
3. **Lower risk** before **Higher risk** (easier/safer fixes first)
4. **Narrower scope** before **Wider scope**

## Step 6: Produce Board Summary

Output the board summary directly in the conversation AND save it to
`reports/triage-rt/board-summary.md`.

### Board Summary Template

```markdown
# Regression Board Triage: <release-branch> (<Product>)

_Generated: <date>_

## Overview

| Metric               | Count |
| -------------------- | ----- |
| Total active tickets | N     |
| Fix in release       | X     |
| Fix with caution     | Y     |
| Defer                | Z     |
| Needs investigation  | W     |
| Duplicates           | D     |

## Priority Order

### P1 — Fix in Release

| #   | Ticket   | Title | Category | Regression | Risk | Scope  | Assignee |
| --- | -------- | ----- | -------- | ---------- | ---- | ------ | -------- |
| 1   | CRT-XXXX | ...   | Example  | No         | Zero | Narrow | Name     |

### P2 — Fix in Release (with Caution)

| #   | Ticket | Title | Category | Regression | Risk | Scope | Assignee |
| --- | ------ | ----- | -------- | ---------- | ---- | ----- | -------- |

### P3 — Defer to Next Release

| #   | Ticket | Title | Category | Regression | Risk | Scope | Assignee |
| --- | ------ | ----- | -------- | ---------- | ---- | ----- | -------- |

### P4 — Needs Investigation

| #   | Ticket | Title | Category | Regression | Risk | Scope | Assignee |
| --- | ------ | ----- | -------- | ---------- | ---- | ----- | -------- |

### P5 — Duplicate / Close

| #   | Ticket | Duplicate Of | Action |
| --- | ------ | ------------ | ------ |

## Cross-References

-   [Describe shared root causes, same-area clusters, dependency chains]

## Assignee Workload

| Assignee | Tickets      | P1  | P2  | P3+ |
| -------- | ------------ | --- | --- | --- |
| Name     | CRT-X, CRT-Y | 1   | 1   | 0   |

## Failures

[Any tickets that could not be triaged, with error details]
```

### Verification Checklist

Before finalising the board summary, verify:

1. **Every ticket** from Step 1 appears in exactly one priority tier table row
2. The **overview metric counts** sum to the total ticket count
3. The **Assignee Workload** ticket lists cover all tickets
4. Any ticket mentioned in **Borderline Calls** also appears in a tier table

### Summary Principles

-   Lead with actionable information — P1 tickets first
-   The summary is a decision-support tool, not a decision-maker — the user
    makes the final calls
-   Flag any ticket where the recommendation is borderline or where you had
    low confidence — but still place it in a tier
-   If two tickets share a root cause, note that fixing one may resolve the
    other — this affects effective workload
