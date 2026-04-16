---
targets: ['*']
description: 'Audit and optimise agentic tooling context to reduce baseline consumption while retaining knowledge'
---

# Optimise Context - Agentic Tooling Context Audit

You are performing a context optimization audit on the agentic tooling configuration. The goal is to reduce baseline context consumption while retaining intent and knowledge, preventing "context rot" where rules accumulate without pruning.

## Important: File Output Required

This command writes changes to rule and skill files. Use plan mode for the analysis/audit phases (the deep review benefits from extended thinking), then **exit plan mode** before implementing changes. Do not finish the command while still in plan mode — the results and file changes will be lost.

## Objective

Analyse the repository's agentic tooling configuration (`.rulesync/`, or equivalent) to identify opportunities to decrease baseline context usage whilst retaining the intent and knowledge currently available.

## Analysis Framework

### 1. Large Rules → Skills Conversion

**Goal**: Identify rules >500 lines that would be better as on-demand skills.

**Analysis**:

- Find all rule files and measure their line counts
- Rules >300 lines are candidates for skill conversion
- Consider: How often is this content actually needed? Is it reference material or always-needed guidance?

**Conversion Pattern**:

```
Before: Large rule loaded whenever glob matches
After:  Slim pointer rule (~30 lines) + on-demand skill with full content
```

**Skill Structure**:

```
external/prompts/skills/<skill-name>/
└── SKILL.md    # Full content with frontmatter: targets, name, description, context: fork
```

**Slim Pointer Pattern**:

```markdown
---
globs: ['<original-globs>']
---

# <Title>

For comprehensive guidance, invoke the `/<skill-name>` skill.

## Quick Reference

- Key point 1
- Key point 2
- Key point 3

## Key Files

| Pattern | Reference |
| ------- | --------- |
| ...     | ...       |
```

### 2. Root Rule Sections → Scoped Rules

**Goal**: Identify sections in root/always-loaded rules that only apply to specific parts of the repo.

**Analysis**:

- Read the root rule (typically `ag-charts.md` or similar with `root: true`)
- Identify sections that are task-specific (playbooks, workflows, checklists)
- Determine which file globs would trigger needing each section

**Extraction Pattern**:

```yaml
# New scoped rule
---
root: false
targets: ['*']
description: '<brief description>'
globs: ['<specific-file-patterns>']
---
# <Section Title>

<Extracted content>
```

**Common Extractions**:

- Bug fix playbooks → `packages/*/src/**/*.ts`
- Documentation playbooks → `**/docs/**/*`, `**/*.mdoc`
- Example playbooks → `**/_examples/**/*`
- Test playbooks → `**/*.test.ts`, `**/*.spec.ts`

### 3. Glob Pattern Narrowing

**Goal**: Identify rules with overly broad globs that could be narrowed.

**Analysis**:

- Find rules using `**/*` or very broad patterns
- Determine the actual scope where the rule content is relevant
- Narrow to specific package paths where possible

**Common Narrowings**:

```yaml
# Before (too broad)
globs: ['**/*Module.ts']

# After (scoped to relevant packages)
globs: ['packages/*/src/**/*Module.ts']
```

### 4. Stale/Redundant Rules

**Goal**: Identify rules that may be outdated or duplicative.

**Analysis**:

- Look for rules covering the same topic
- Check if rule content is still accurate
- Identify rules that reference non-existent files/patterns

## Output Format

Provide a structured report:

```markdown
# Context Optimization Report

## Executive Summary

- Current baseline context: ~X KB
- Estimated savings: ~Y KB
- Recommendations: N changes

## Findings

### 1. Large Rules (Skill Candidates)

| Rule | Lines | Glob | Recommendation   |
| ---- | ----- | ---- | ---------------- |
| ...  | ...   | ...  | Convert to skill |

### 2. Root Rule Extractions

| Section | Lines | Target Glob | Priority        |
| ------- | ----- | ----------- | --------------- |
| ...     | ...   | ...         | High/Medium/Low |

### 3. Glob Narrowing Opportunities

| Rule | Current Glob | Suggested Glob | Reason |
| ---- | ------------ | -------------- | ------ |
| ...  | ...          | ...            | ...    |

### 4. Stale/Redundant Rules

| Rule | Issue | Action              |
| ---- | ----- | ------------------- |
| ...  | ...   | Remove/Update/Merge |

## Proposed Plan

### Phase 1: High Impact (implement first)

1. ...

### Phase 2: Medium Impact

1. ...

### Phase 3: Low Impact (optional)

1. ...
```

## Implementation

After presenting findings, ask the user:

1. **Scope**: Which changes should be implemented?
    - All recommendations
    - Just skill conversions
    - Just playbook extractions
    - Just glob narrowing
    - Custom selection

2. **Repos**: If changes span multiple repos (e.g., prompts repo + main repo):
    - Implement in both repos together
    - Main repo only
    - Prompts repo only

Then implement the approved changes following the patterns above.

## Verification

After implementation:

1. Run rulesync regeneration: `./external/ag-shared/scripts/setup-prompts/setup-prompts.sh --verbose`
2. Run verification: `./external/ag-shared/scripts/setup-prompts/verify-rulesync.sh . claudecode`
3. Confirm generated files match expectations

## Key Principles

- **Retain intent**: Every optimization should preserve the original knowledge and guidance
- **On-demand over always-on**: Large reference material should be available when needed, not loaded by default
- **Scope narrowly**: Rules should load only when working on relevant files
- **Quick reference over full docs**: Slim rules provide essential reminders; skills provide depth
- **Test the workflow**: After changes, verify skills can be invoked and rules load correctly
