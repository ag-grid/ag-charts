---
targets: ['*']
name: fr
description: "End-to-end feature implementation workflow driven by a JIRA ticket. Orchestrates planning, implementation, testing, docs, quality checks, and PR creation as a coordinating agent that delegates to sub-agents. Use when the user says /fr, 'implement this feature', 'implement this ticket', 'work on AG-XXXXX', or provides a JIRA ticket reference and wants a complete, structured feature implementation from planning through to PR creation. Also use when resuming a feature session with /fr --resume."
invocable: user-only
context: fork
---

# Feature Request Implementation (/fr)

Orchestrate a complete feature implementation from JIRA ticket to merged PR. You act as a **coordinator** — delegate research, implementation, and review work to sub-agents and skills, keeping your own context focused on decisions and phase transitions.

## Why Coordinator Mode Matters

Feature implementations generate enormous context: JIRA descriptions, codebase research, implementation diffs, test output, review feedback. If you do everything inline, your context fills up before you finish. Instead:

- **Delegate** research, implementation steps, and reviews to sub-agents
- **Use the state directory** as shared memory between agents
- **Summarise** sub-agent results rather than ingesting full transcripts
- **Stay lean** — your job is to make decisions and manage phase transitions

Sub-agents are cheap; context overflow is not. When in doubt, delegate.

## Hands-off by Default

This workflow should run with minimal user intervention. The human-in-the-loop gates are:

- **Phase 1** — plan approval (and `/interview-me` if clarification needed)
- **Phase 4** — user review of the finished implementation

Everything else — running builds, executing tests, fixing lint errors, iterating on review findings — you do yourself. Never ask the user to run a command you can run. If a test fails, read the output and fix it. If a build breaks, diagnose and repair. The user's time is for decisions and judgment calls, not for running `yarn nx test`.

## Arguments

Parse the invocation for a JIRA ticket reference:

- `AG-XXXXX` or `ST-XXXXX` — JIRA ticket key
- Full JIRA URL — extract the ticket key
- `--resume` — resume the most recent in-progress feature

Examples: `/fr AG-17064`, `/fr https://ag-grid.atlassian.net/browse/AG-17064`, `/fr --resume`

---

## State Directory

State is stored per-ticket in the **main checkout** (not the worktree), so it persists across worktrees and sessions. Resolve the main checkout root and create the state directory:

```bash
MAIN_REPO=$(git rev-parse --path-format=absolute --git-common-dir | sed 's/\.git$//')
STATE_DIR="${MAIN_REPO}tmp/fr-state/<TICKET-KEY>/"
mkdir -p "$STATE_DIR"
```

For example, `/fr AG-17064` creates: `<main-checkout>/tmp/fr-state/AG-17064/`

### Directory contents

```
tmp/fr-state/AG-17064/
├── intent.md          # JIRA summary, ACs, scope boundaries
├── research.md        # Codebase research findings
├── plan.md            # The implementation plan
├── progress.md        # Step completion tracking
├── review-feedback.md # Quality check findings and resolution
└── decisions.md       # Key decisions and their rationale
```

These files are the shared memory between you and your sub-agents. When delegating, give sub-agents absolute paths to these files so they have context without you relaying everything through your own conversation.

Store the resolved `STATE_DIR` path early and use it throughout — don't re-derive it for every reference.

---

## Phase 0: Context Gathering

**Goal:** Build a clear picture of what needs to be done and write it to `intent.md`.

1. **Fetch the JIRA ticket** via Atlassian MCP:
    ```
    mcp__atlassian__getJiraIssue(issueIdOrKey: '<TICKET-KEY>', responseContentFormat: 'markdown')
    ```

2. **Write `intent.md`** with:
    - Ticket title and key
    - Description summary
    - Functional acceptance criteria (verbatim from ticket)
    - Non-functional acceptance criteria (verbatim from ticket)
    - Linked tickets or dependencies
    - Your 1-2 sentence summary of the core intent — what problem does this solve?

3. **Delegate codebase research** to a sub-agent:
    > "Read `<STATE_DIR>/intent.md`. Research the codebase to identify: (a) which packages and files are likely affected, (b) existing patterns for similar features, (c) relevant tests and docs pages. Write findings to `<STATE_DIR>/research.md`."

4. **Read the research summary** and ensure you understand the scope before planning.

If the JIRA fetch fails, ask the user to describe the feature and write `intent.md` from their description instead.

---

## Phase 1: Planning

**Goal:** Produce a plan that covers implementation, testing, and documentation for every acceptance criterion, with no unresolved ambiguities.

### Create the Plan

Enter plan mode. Draft a plan in `<STATE_DIR>/plan.md` covering:

1. **Implementation steps** — what code changes, in which files, in what order
2. **Test strategy** — what tests to add or modify (see Test Strategy below)
3. **Documentation** — what docs pages need creating or updating
4. **Verification steps** — how to confirm each AC is met

For each plan step, note which AC(s) it satisfies. Every AC should map to at least one step.

### Test Strategy

The right test type depends on what's changing. Get this wrong and you'll either have flaky tests or miss real bugs.

| Change Type | Test Approach | Why |
|---|---|---|
| Canvas / rendering output | Integration tests (Jest snapshots) | Canvas output is deterministic and testable without a browser |
| DOM changes (overlays, popups, interactive controls) | E2E tests (Playwright) | DOM interactions need a real browser to exercise properly |
| Data processing, logic, utilities | Unit tests | Pure logic benefits from fast, isolated tests |
| API surface changes | Integration tests + type checks | Verify options are accepted and produce correct output |

When a feature touches both rendering and DOM (common for interactive features), plan for both integration and e2e tests. Don't skip e2e for DOM changes — integration tests can't exercise real browser behaviour like hover states, focus management, or DOM measurement.

### Review and Iterate

Planning is cheap; rework is expensive. The plan needs to be solid before implementation begins.

1. **For non-trivial plans** (more than ~5 steps, cross-package changes, or unfamiliar areas), run `/plan-review` and iterate on its findings.

2. **If anything is uncertain** — ambiguous requirements, unclear existing behaviour, multiple valid approaches — run `/interview-me` to surface and resolve questions with the user.

3. **Iterate until:**
    - Every AC has at least one plan step covering it
    - No open questions or ambiguities remain
    - Test coverage approach is specified for each change type
    - Documentation needs are identified
    - You are confident the plan, when executed, fully satisfies the ticket scope

Write final decisions to `<STATE_DIR>/decisions.md` so sub-agents can reference them during implementation.

Exit plan mode once the plan is approved.

---

## Phase 2: Implementation

**Goal:** Execute the plan, delegating where possible and tracking progress.

### Delegation Strategy

For each plan step, decide whether to delegate or do inline:

**Delegate** when the step is self-contained and well-defined:
- "Add property X to interface Y and its validator"
- "Create integration test for new feature Z"
- "Update docs page for feature configuration"

Give each sub-agent:
- The specific plan step(s) to implement
- Absolute paths to `<STATE_DIR>/intent.md` and `<STATE_DIR>/plan.md` for context
- Relevant file paths from the research phase
- Any decisions from `<STATE_DIR>/decisions.md` that affect their work

**Do inline** when the step:
- Requires real-time judgment or creative decisions
- Touches many interdependent files simultaneously
- Depends on code just written by another step that hasn't been saved yet

### Progress Tracking

After each step completes (delegated or inline), update `<STATE_DIR>/progress.md`:

```markdown
## Step 1: [Description] — DONE
- Files: src/foo.ts, src/foo.test.ts
- Notes: [any deviations from plan]

## Step 2: [Description] — IN PROGRESS
- Started: [what's done so far]
- Remaining: [what's left]
```

### Build Health

After meaningful changes, verify the build compiles and passes basic checks:
```bash
yarn nx build:types <package>
yarn nx lint <package>
```

Fix issues before moving to the next step — don't let them accumulate.

When a batch of related steps is complete (e.g., all implementation for a feature area, or after adding tests), run the test suite for affected packages:
```bash
yarn nx test <package> --testPathPattern <relevant-pattern>
```

Read the output. If tests fail, fix them — don't defer to the quality gate and don't ask the user to run them.

---

## Phase 3: Quality Gate

**Goal:** Verify the implementation is complete, correct, and ready for human review.

Record all findings in `<STATE_DIR>/review-feedback.md`.

### 1. Run All Tests

Before running review skills, verify that every test actually passes. Run the full test suites for all affected packages — not just the new tests, but the entire suite to catch regressions.

```bash
# Run tests for every package you changed
yarn nx test <package>

# E2E tests (run if e2e tests were added or DOM-affecting changes were made)
yarn nx test:e2e <website-package>
```

Consult `CLAUDE.md` for the repo-specific test commands — package names and test targets vary across AG products.

If you added tests with `--testPathPattern` during implementation, now is the time to run without the filter. A test that passes in isolation can fail when the full suite runs (shared state, ordering issues).

Read the output carefully. Fix any failures before proceeding — review skills assume a green test suite. If a pre-existing test fails due to your changes, that's a regression you need to fix, not a pre-existing issue to ignore.

### 2. Plan Verification

```
/plan-verify --jira <ticket-key>
```

This verifies plan steps are complete, implementation matches intent, and each JIRA acceptance criterion is individually validated as PASS/PARTIAL/MISSING.

### 3. Full PR Review

```
/pr-review --full
```

This runs standard code review, devil's advocate pass, JIRA completeness check, and code simplification review.

### 4. Triage and Fix

For each finding:

| Severity | Action |
|---|---|
| P0 / P1 | Fix before proceeding — these are blockers |
| P2 (code issue) | Fix if straightforward; otherwise note for user review |
| P2 (JIRA gap) | Fix — missing AC coverage is a real gap, not optional |
| P3 | Note but don't block |

**If fixes require significant new work** (new plan steps, architectural changes), return to **Phase 1** to re-plan rather than patching ad hoc. Update `<STATE_DIR>/plan.md` with the additions.

After fixing, re-run the relevant checks to confirm resolution. Don't skip re-verification — a fix can introduce new issues.

---

## Phase 4: User Review

**Goal:** Get human sign-off before creating the PR.

Present a summary:

```markdown
## Feature Implementation Summary

**Ticket:** AG-XXXXX — [Title]
**Branch:** [branch name]

### Changes
- [High-level summary of what was implemented]
- [Key packages/files changed]

### AC Status
| AC# | Criterion | Status |
|-----|-----------|--------|
| 1   | [...]     | PASS   |
| 2   | [...]     | PASS   |

### Test Coverage
- Integration tests: [count] added/modified
- E2E tests: [count] added/modified
- Unit tests: [count] added/modified

### Documentation
- [Pages created/updated, or "None required"]

### Quality Gate
- Tests: [all passing / X failures fixed]
- Plan verification: [PASS/issues found]
- PR review: [P0: 0, P1: 0, P2: X resolved, P3: Y noted]

### Open Items
- [Any P3 findings deferred]
- [Any decisions that need user input]
```

**Stop and wait for the user's response.** Don't proceed to PR creation without explicit approval.

Handle feedback:
- **Approved** → proceed to Phase 5
- **Minor tweaks** (naming, comments, small fixes) → fix inline, re-summarise, ask again
- **Significant feedback** (missed requirements, wrong approach) → return to Phase 1 with the feedback added to `intent.md` as additional constraints

---

## Phase 5: PR Creation

**Goal:** Create the PR and get it to a green, reviewable state.

```
/pr-create --monitor
```

This handles committing, pushing, creating the PR with a summary, and monitoring CI. If CI fails, it will attempt to fix straightforward issues (lint, formatting) automatically.

For CI failures that need manual intervention:
1. Read the failure details
2. Fix the issue (delegate to a sub-agent if isolated)
3. Push and let `--monitor` re-check

Iterate until CI is green. Present the PR URL to the user when ready for team review.

### JIRA Comment

After the PR is published and CI is green, draft a comment for the JIRA ticket. The comment should be tight and concise — PMs and other engineers will scan it quickly. Structure:

1. **PR link** — lead with the PR URL
2. **Edge cases and AC gaps** — bullet list of any acceptance criteria gaps, edge cases you made a judgement call on, or areas that need PM feedback. Only include items that are genuinely worth flagging — don't pad with "everything went fine" bullets.
3. **Docs staging link** — if docs pages were added or updated, include the staging URL so reviewers can preview them

If there's nothing notable beyond the PR link (all ACs met cleanly, no edge cases), keep it to just the PR URL with a one-line summary.

**Before posting:** Present the exact comment text to the user for approval. Check whether the ticket already has a comment for this PR (e.g., from a previous `/fr` run) — if so, propose updating that comment rather than adding a new one. Only post via `mcp__atlassian__addCommentToJiraIssue` after the user confirms.

---

## Resuming a Session (`--resume`)

If invoked with `--resume`:

1. Resolve the main checkout root and list directories in `tmp/fr-state/`
2. If multiple ticket directories exist, pick the most recently modified one (or ask the user which ticket to resume if ambiguous)
3. Read `progress.md` to determine the current phase
4. Read `intent.md` for feature context
5. Summarise current state to the user before continuing
6. Pick up from the last incomplete phase

If invoked with a specific ticket (`/fr AG-17064`) and the state directory already exists, this is a resume — read existing state rather than starting fresh.

---

## Anti-patterns

- **Don't accumulate context** — if you have walls of code in your conversation, you're not delegating enough. Summarise sub-agent results; don't paste their full output.
- **Don't skip plan review** — if the plan is non-trivial, `/plan-review` catches gaps that are expensive to fix later. The upfront cost is small compared to rework.
- **Don't fix P0/P1 issues silently** — always tell the user what was found and what you fixed. Transparency builds trust.
- **Don't create the PR before user review** — Phase 4 exists because the user has context you don't. Skipping it risks rework after the PR is already open.
- **Don't inline everything** — the most common failure mode is trying to do all implementation yourself and running out of context. Delegate aggressively.
- **Don't ask the user to run commands** — if you can run it, run it. Tests, builds, lints, type checks — execute them yourself and read the output. The user's role is decisions and judgment, not running shell commands on your behalf.
