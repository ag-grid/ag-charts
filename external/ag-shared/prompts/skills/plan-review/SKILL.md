---
targets: ['*']
name: plan-review
description: 'Review plans for completeness, correctness, and verifiability'
invocable: user-only
---

# Plan Review Prompt

You are a plan reviewer. Review implementation plans for completeness, correctness, and verifiability using a multi-agent approach with parallel review perspectives.

## Input Requirements

User provides one of:

-   Explicit plan file path: `/plan-review path/to/plan.md`
-   Auto-detect from context: `/plan-review` (looks for recent plans)

Optional flags:

-   `--quick` - Fast review with fewer agents (2-3 vs 5-6)
-   `--thorough` - Comprehensive review (default)
-   `--external` - Include external tools (Codex/Gemini) if available

## Sub-Documents

Load sub-documents progressively based on the review mode and phase.

| Document | Purpose | When to Load |
|----------|---------|-------------|
| `agent-prompts-quick.md` | Agent prompt templates for quick mode | Quick mode (--quick) |
| `agent-prompts-thorough.md` | Agent prompt templates for thorough mode | Thorough mode (default) |
| `output-format.md` | Report template and output structure | Phase 3 (Synthesis) |
| `discovered-work.md` | Discovered Work Protocol for sub-agents | Include in all sub-agent prompts |
| `external-tools.md` | Codex/Gemini integration | Only with --external flag |

## Execution Phases

### Phase 0: Plan Detection & Mode Selection

1. **Detect plan file:**

    ```bash
    # If explicit path provided, use it
    # Otherwise, check common locations:
    # 1. ${CLAUDE_CONFIG_DIR:-~/.claude}/plans/ (recent files)
    # 2. Current conversation context
    # 3. node_modules/.cache/plans/

    # List recent plan files
    find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plans node_modules/.cache/plans -name "*.md" -mtime -7 2>/dev/null | head -10
    ```

2. **Determine review mode:**

    | Flag                   | Mode     | Agents | Use Case                            |
    | ---------------------- | -------- | ------ | ----------------------------------- |
    | `--quick`              | Quick    | 2-3    | Fast feedback, simple plans         |
    | `--thorough` (default) | Thorough | 5-6    | Comprehensive review, complex plans |

3. **Extract original request/specification:**

    **Critical:** The original user request is the source of truth for coverage verification.

    - Search conversation context or plan metadata for the original user request or linked specification
    - If the plan embeds or references the original request, extract it
    - Otherwise, check the conversation history that preceded the plan
    - Decompose the original request into a **numbered requirements checklist** — discrete, verifiable asks
    - Each requirement should be atomic (one testable assertion per item)

    Store as `${ORIGINAL_REQUIREMENTS}` for use by review agents.

    If no original request can be located:
    - Flag as IMPORTANT: "Plan does not embed or reference the original request/specification"
    - Recommend the plan include a **Source Request** section quoting or summarising the original ask
    - **Fallback:** Derive `${ORIGINAL_REQUIREMENTS}` from the plan's stated goals/objectives instead — decompose them into the same numbered checklist format. Note in the output that coverage assessment is based on plan goals (lower confidence) rather than the original request

4. **Extract and validate intent:**

    **Critical:** Intent clarity is vital for successful execution. Extract:

    - **Core intent**: The fundamental "why" behind this plan (1-2 sentences)
    - **Success definition**: What does "done well" look like?
    - **Non-goals**: What this plan explicitly does NOT aim to achieve
    - **Constraints**: Boundaries that must be respected

    If intent is unclear or missing from the plan, flag as CRITICAL issue.

    **Compare against original request:** Does the plan's stated intent align with what the user actually asked for? Flag divergence as CRITICAL — the plan may have drifted from the original ask or reinterpreted requirements.

5. **Parse plan structure:**

    Extract from the plan file:

    - **Goals/objectives**: What the plan aims to achieve
    - **Tasks/tasks**: Individual implementation tasks
    - **Files to modify**: Target files for changes
    - **Verification criteria**: How success is measured
    - **Dependencies**: Relationships between tasks

6. **Build task dependency graph:**

    Analyse task dependencies:

    - Explicit dependencies (task X requires task Y)
    - Implicit dependencies (file modifications, data flow)
    - Identify parallelisation opportunities

### Phase 1: Parallel Review Agents

Launch specialised review agents based on mode. Load the appropriate agent prompts sub-document:

- **Quick mode:** Read `.rulesync/skills/plan-review/agent-prompts-quick.md`
- **Thorough mode:** Read `.rulesync/skills/plan-review/agent-prompts-thorough.md`

Include the Discovered Work Protocol from `.rulesync/skills/plan-review/discovered-work.md` in all sub-agent prompts.

#### Quick Mode (3 agents)

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK MODE AGENTS                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Intent & Completeness Reviewer                            │
│    - Is core intent clearly stated and propagated?          │
│    - Does plan intent match the original request intent?    │
│    - Are all original requirements covered by plan tasks?   │
│    - Edge cases: What could go wrong?                       │
├─────────────────────────────────────────────────────────────┤
│ 2. Verification Reviewer                                     │
│    - Testability: Can each task be verified?                │
│    - Success criteria: Are they measurable?                 │
│    - Evidence: How will completion be demonstrated?         │
├─────────────────────────────────────────────────────────────┤
│ 3. Parallelisability Analyser                               │
│    - Dependencies: What must run sequentially?              │
│    - Concurrency: What can run in parallel?                 │
│    - Agent topology: Optimal execution pattern              │
│    - Intent in sub-agent prompts: Is WHY conveyed?          │
└─────────────────────────────────────────────────────────────┘
```

#### Thorough Mode (6-7 agents)

```
┌─────────────────────────────────────────────────────────────┐
│                   THOROUGH MODE AGENTS                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Intent Reviewer (CRITICAL - runs first)                   │
│ 2. Completeness & Specification Coverage Reviewer            │
│ 3. Technical Reviewer                                        │
│ 4. Verification Reviewer                                     │
│ 5. Risk Reviewer                                             │
│ 6. Parallelisability Analyser                               │
│ 7. External Reviewer (optional, --external flag)            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Agentic Execution Analysis

After gathering review findings, analyse the plan for optimal agentic execution.

#### Agentic Patterns to Assess

| Pattern                    | Description                          | When to Recommend                 |
| -------------------------- | ------------------------------------ | --------------------------------- |
| **Simple Execution**       | Main agent executes directly         | Simple, low-risk tasks            |
| **Sub-agent Delegation**   | Launch dedicated sub-agent           | Complex tasks requiring focus     |
| **Sub-agent + Verify**     | Implementation + verification agent  | Tasks with testable outcomes      |
| **Iterate-until-verified** | Loop: implement → verify → fix       | Tasks with clear success criteria |
| **Parallel Fan-out**       | Launch N agents for independent work | Tasks with no dependencies        |
| **Orchestrated Pipeline**  | Chained agents with handoffs         | Sequential dependent tasks        |
| **Tree Execution**         | Parent spawns children, aggregates   | Divide-and-conquer tasks          |

#### Dependency Detection

Analyse for:

1. **File-level dependencies:** Does task B modify files created by task A?
2. **Data-flow dependencies:** Does task B need outputs from task A?
3. **Implicit ordering:** Build before test, create before modify, format before commit

### Phase 3: Synthesis

Load `.rulesync/skills/plan-review/output-format.md` for the report template.

Aggregate findings from all review agents:

1. **Categorise by severity:** Critical / Important / Minor
2. **Consolidate duplicates** — merge similar findings from different reviewers
3. **Generate actionable recommendations** — specific changes, priority order
4. **Build specification coverage analysis** — traceability matrix, coverage metrics
5. **Aggregate discovered tasks** — call `TaskList`, triage, include in report

### Phase 4: Interactive Resolution (Optional)

If issues found, present to user for iterative refinement.

---

## Usage Examples

```bash
# Thorough review (default)
/plan-review

# Quick review for faster feedback
/plan-review --quick

# Explicit plan file
/plan-review path/to/plan.md

# Include external tools if available
/plan-review --external
```

---

## Integration with Other Commands

-   **Before implementation:** Run `/plan-review` to validate the plan
-   **During implementation:** Run `/plan-implementation-review` to track progress
-   **After implementation:** Run tests and verification tasks from the plan

---

## Cache Location

Review results are cached for resumability:

```
node_modules/.cache/plan-reviews/
├── {plan-name}-{timestamp}.json    # Raw agent findings
├── {plan-name}-report.md           # Generated report
└── metadata.json                   # Review session metadata
```
