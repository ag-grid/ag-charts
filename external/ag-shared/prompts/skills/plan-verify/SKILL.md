---
targets: ['*']
name: plan-verify
description: 'Verify plan execution against implementation and JIRA acceptance criteria. Use when reviewing implementation completeness, checking plan progress, validating against ticket ACs, or saying /plan-verify.'
invocable: user-only
context: fork
---

# Plan Verify Prompt

You are an implementation reviewer. Verify plan execution by tracking progress, identifying gaps, validating quality, and checking JIRA acceptance criteria.

## Input Requirements

User provides one of:

- Explicit plan file path: `/plan-verify path/to/plan.md`
- Auto-detect from context: `/plan-verify` (looks for recent plans)

Optional flags:

- `--quick` - Fast progress check (2 agents + JIRA if detected)
- `--thorough` - Comprehensive review (default, 4 agents + JIRA if detected)
- `--jira <ticket-key>` - Explicit JIRA ticket for AC verification
- `--no-jira` - Skip JIRA AC verification

## Sub-Documents

Load sub-documents progressively based on the review mode and phase.

| Document | Purpose | When to Load |
|----------|---------|-------------|
| `agent-prompts.md` | Agent prompt templates for all modes | Phase 1 (agent launch) |
| `output-format.md` | Report template and output structure | Phase 3 (report generation) |
| `discovered-work.md` | Discovered Work Protocol for sub-agents | Include in all sub-agent prompts |

The `discovered-work.md` is shared with the `plan-review` skill.

## Execution Phases

### Phase 0: Context Gathering & Mode Selection

1. **Load original plan file:**

    ```bash
    # If explicit path provided, use it
    # Otherwise, check common locations:
    find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plans node_modules/.cache/plans -name "*.md" -mtime -7 2>/dev/null | head -10
    ```

2. **Determine review mode:**

    | Flag | Mode | Agents | Use Case |
    |------|------|--------|----------|
    | `--quick` | Quick | 2 (+1 JIRA) | Fast progress check |
    | `--thorough` (default) | Thorough | 4 (+1 JIRA) | Comprehensive validation |

3. **Detect git changes since plan creation:**

    ```bash
    # Get plan creation/modification time
    plan_date=$(stat -f %m "$PLAN_FILE" 2>/dev/null || stat -c %Y "$PLAN_FILE")

    # Find commits since plan was created
    git log --oneline --since="@$plan_date" --all

    # Get diff of all changes
    git diff --name-only HEAD~N  # N = number of commits since plan

    # Get detailed changes for each file
    git diff HEAD~N -- path/to/file.ts
    ```

4. **Extract core intent from plan:**

    **Critical:** Understanding intent is essential for assessing implementation quality.
    - What is the core "why" of this plan?
    - What does "done well" look like (not just "done")?
    - What are the non-goals/boundaries?

    This intent guides assessment of whether implementation serves the goal, not just completes tasks.

5. **Identify modified files and their relationship to plan:**

    Cross-reference:
    - Files mentioned in plan → have they been modified?
    - Files modified → are they in the plan?
    - Unexpected changes → drift from plan or drift from intent?

6. **Detect and fetch JIRA ticket (default behaviour):**

    Unless `--no-jira` is set, automatically detect the JIRA ticket key from (in priority order):
    1. Explicit `--jira AG-XXXXX` argument
    2. Plan file content: scan for `AG-\d+` pattern in title or first section
    3. Branch name: extract from `ag-XXXXX/` prefix (e.g. `ag-10316/custom-legend-item-tooltip`)

    ```bash
    # Detect from branch name
    git branch --show-current | grep -oE 'ag-[0-9]+' | head -1 | tr '[:lower:]' '[:upper:]'
    ```

    Fetch the ticket via Atlassian MCP:
    ```
    mcp__atlassian__getJiraIssue(cloudId, issueIdOrKey, responseContentFormat: 'markdown')
    ```

    Extract "Functional Acceptance Criteria" and "Non-functional Acceptance Criteria"
    sections from the ticket description. These become the input for Agent 5.

    If the MCP tool is unavailable, the fetch fails, or no ticket key is detected,
    log a note and continue without JIRA verification (do not block the review).

### Phase 1: Implementation Analysis (Parallel Agents)

Launch analysis agents based on mode. Load `agent-prompts.md` for prompt templates.

Include the Discovered Work Protocol from the `plan-review` skill's `discovered-work.md` in all sub-agent prompts.

#### Quick Mode (2 + JIRA agents)

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK MODE AGENTS                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Progress Auditor                                          │
│    - Maps plan steps to code changes                        │
│    - Calculates completion percentage                       │
│    - Identifies gaps between plan and implementation        │
├─────────────────────────────────────────────────────────────┤
│ 2. Verification Checker                                      │
│    - Test coverage status                                   │
│    - Build status                                           │
│    - Lint/type check status                                 │
├─────────────────────────────────────────────────────────────┤
│ 5. JIRA AC Verifier (when ticket detected)                   │
│    - Independently verifies each AC against implementation  │
│    - Reports PASS / PARTIAL / MISSING per criterion         │
│    - Flags gaps not covered by the plan                     │
└─────────────────────────────────────────────────────────────┘
```

#### Thorough Mode (4 + JIRA agents)

```
┌─────────────────────────────────────────────────────────────┐
│                   THOROUGH MODE AGENTS                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Progress Auditor                                          │
│ 2. Gap Detector                                              │
│ 3. Intent & Quality Validator (CRITICAL)                     │
│ 4. Test Coverage Reviewer                                    │
│ 5. JIRA AC Verifier (when ticket detected)                   │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Cross-Reference Analysis

Correlate plan steps with implementation evidence.

1. **Map to Git Commits:**

    ```bash
    # For each plan step, find related commits
    git log --oneline --grep="step keyword" --all
    git log --oneline -- "affected/file/path.ts"
    ```

2. **Map to Modified Files:**

    For each step in the plan:
    - Expected files to modify
    - Actually modified files
    - Alignment check

3. **Check Test Results (if available):**

    ```bash
    yarn nx test <package> --testPathPattern="relevant-test"
    yarn nx build:types <package>
    ```

4. **Check Build Status (if available):**

    ```bash
    yarn nx build:types <package>
    yarn nx lint <package>
    ```

### Phase 3: Report Generation

Load `output-format.md` for the report template.

1. **Calculate completion metrics** — overall %, per-section, per-step
2. **Identify remaining work** — pending steps, blockers, estimated effort
3. **Document deviations** — planned vs actual, unexpected changes
4. **Provide actionable next steps** — prioritised remaining work
5. **Aggregate discovered tasks** — call `TaskList`, triage, include in report
6. **JIRA AC verification (when ticket detected)** — per-criterion PASS/PARTIAL/MISSING table, gap summary, recommendations. If no ticket detected, note "JIRA AC verification skipped — no ticket detected."

---

## Usage Examples

```bash
# Thorough review (default — auto-detects JIRA ticket)
/plan-verify

# Quick progress check
/plan-verify --quick

# Explicit plan file
/plan-verify path/to/plan.md

# Explicit JIRA ticket
/plan-verify --jira AG-10316

# Skip JIRA verification
/plan-verify --no-jira
```

---

## Integration with Other Commands

- **Before implementation:** Run `/plan-review` to validate the plan
- **During implementation:** Run `/plan-verify` periodically
- **After implementation:** Run full test suite and documentation review

---

## Cache Location

Review results are cached for tracking progress over time:

```
node_modules/.cache/plan-verify/
├── {plan-name}-{timestamp}.json    # Raw agent findings
├── {plan-name}-progress.json       # Progress tracking over time
├── {plan-name}-report.md           # Generated report
└── metadata.json                   # Review session metadata
```
