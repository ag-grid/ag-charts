# JIRA Ticket Estimation Workflow

Structured complexity and effort estimation for JIRA tickets, features, or projects. Produces consistent reports with complexity levels, time estimates, dependency analysis, risk assessment, and identification of unknowns.

## Prerequisites

- User provides JIRA ticket content (markdown format preferred).
- Access to repository codebase for dependency analysis.
- Understanding of project architecture (consult `CLAUDE.md` or technology stack rules if needed).
- Product-specific calibration data loaded from the product file.

## Workflow

### Step 0: Load Required Documentation

**Read these files FIRST before any analysis:**

1. Technology stack rules (in target repo) — Architecture constraints and patterns.
2. `CLAUDE.md` — Repository conventions and build requirements.

**After reading, confirm you understand:**

- [ ] Repository structure and key packages.
- [ ] Build and test commands.
- [ ] Architectural constraints (e.g., zero runtime dependencies).

### Step 1: Gather and Analyse Ticket Information

**Complete ALL before proceeding:**

- [ ] Receive JIRA ticket content from user (markdown format).
- [ ] Extract key requirements, acceptance criteria, and constraints.
- [ ] Identify the primary affected areas (packages/files).
- [ ] Note what information is present vs. missing in the ticket.

**Initial Analysis Questions:**

- What type of work is this? (bug fix, new feature, refactoring, docs, etc.)
- Which packages are affected? (community, enterprise, types, website, etc.)
- Are there related tickets or dependencies mentioned?
- Is the scope well-defined or vague?

### Step 2: Identify Ambiguities and Implementation Choices

**CRITICAL: Do NOT proceed to estimation without completing this step.**

**Analyse for ambiguities in these areas:**

1. **Technical Approach**

    - Are there multiple valid implementation strategies?
    - Is the desired architecture/pattern specified?
    - Are performance requirements defined?

2. **Scope Boundaries**

    - Is the feature scope clearly bounded?
    - Are edge cases and error handling specified?
    - Is backward compatibility required?

3. **Integration Points**

    - How should this integrate with existing systems?
    - Are framework wrappers (React/Angular/Vue) affected?
    - Are there public API changes?

4. **Testing & Quality**

    - What level of test coverage is expected?
    - Are visual regression tests needed?
    - Should benchmarks be added/updated?

5. **Documentation**
    - Is documentation required?
    - Are examples needed?
    - Should migration guides be written?

**For each significant ambiguity identified:**

- [ ] Document the ambiguity clearly.
- [ ] List the possible implementation choices.
- [ ] Note how each choice impacts time/complexity/risk.
- [ ] **USE AskUserQuestion tool** to get clarification before proceeding.

**Use the AskUserQuestion tool to present ambiguities:**

Present 1-4 ambiguities at once using the AskUserQuestion tool with this structure:

- **question**: Clear question about the ambiguity (e.g., "How should the 'xy' mode work visually?").
- **header**: Short label (max 12 chars) (e.g., "Dual-axis UI").
- **options**: 2-4 implementation choices with:
    - **label**: Concise option name (e.g., "Two Navigators").
    - **description**: Impact explanation (e.g., "Show both X-axis (bottom) and Y-axis (right) navigators - 20% more complexity, clearer UI").
- **multiSelect**: false (user should pick one approach).

**After receiving answers:**

- Document the chosen approach in a summary.
- Adjust estimate based on selected options.
- Include decisions in the "Implementation Decisions" section of the report.

### Step 3: Investigate Codebase Dependencies and Complexity

**Use the Explore agent for thorough codebase analysis:**

- [ ] Identify all affected files and packages.
- [ ] Analyse existing similar implementations for patterns.
- [ ] Check for dependencies on other systems/modules.
- [ ] Look for related tests that need updating.
- [ ] Search for documentation that needs changes.

**Key Investigation Areas:**

1. **Core Implementation**

    - Where is the main logic located?
    - How complex is the existing code in that area?
    - Are there similar features to reference?

2. **Type System**

    - Will `ag-charts-types` need updates?
    - Are there complex type definitions involved?
    - Will this affect public API surface?

3. **Testing Surface**

    - How many test files are affected?
    - Are image snapshots needed?
    - Will this need E2E tests?

4. **Documentation & Examples**

    - How many doc pages need updates?
    - Are new examples required?
    - Will framework variants be generated?

5. **Build Dependencies**
    - Which packages need rebuilding?
    - Are there circular dependency risks?
    - Will this affect build performance?

### Step 4: Generate Structured Estimation Report

**Use this exact template for consistency:**

---

## Estimation Report: [Ticket ID/Feature Name]

**Date:** [Current date]
**Estimator:** Claude Code
**Ticket Summary:** [Brief 1-2 sentence summary]

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Effort** | [X-Y days] ([X-Y hours]) |
| **Complexity** | [Low \| Medium \| High \| Very High] |
| **Risk Level** | [Low \| Medium \| High] |
| **Confidence** | [Low \| Medium \| High] |

**Key Highlights:**

- [1-2 sentence summary of main implementation work].
- [Major scope decision or constraint].
- [Top risk or concern if applicable].

---

### 1. Estimated Complexity Level

**Overall Complexity: [Low | Medium | High | Very High]**

**Rationale:**

- [Explanation of complexity drivers].
- [Why this level was chosen].

**Complexity Breakdown:**

- Implementation: [Low/Medium/High].
- Testing: [Low/Medium/High].
- Documentation: [Low/Medium/High].
- Integration: [Low/Medium/High].

---

### 2. Estimated Time Effort

**Total Estimate: [X-Y days] for a single developer**

**Confidence Level: [Low | Medium | High]**

**Breakdown:**

- **Investigation & Design:** [X hours/days]

    - Understanding requirements.
    - Design decisions.
    - Spike work if needed.

- **Core Implementation:** [X hours/days]

    - Primary code changes.
    - Type definitions.
    - Public API updates.

- **Testing:** [X hours/days]

    - Unit tests.
    - E2E tests (if applicable).
    - Visual regression tests (if applicable).
    - Benchmark updates (if applicable).

- **Documentation:** [X hours/days]

    - Doc page updates/creation.
    - Example creation.
    - Migration guides (if applicable).

- **Review & Iteration:** [X hours/days]
    - Code review feedback.
    - Test failures.
    - Bug fixes.

**Assumptions:**

- [List key assumptions affecting the estimate].
- [e.g., "Assuming developer is familiar with canvas rendering"].
- [e.g., "Assuming no major architectural changes needed"].

---

### 3. Dependencies, Gaps & Missing Information

**External Dependencies:**

- [List dependencies on other teams/tickets].
- [Any blocked/blocking items].

**Information Gaps:**

- [What's not specified in the ticket].
- [Questions that remain unanswered].
- [Areas needing clarification from stakeholders].

**Implicit Scope (not explicitly mentioned):**

- [Tasks likely required but not stated].
- [e.g., "Framework wrapper updates"].
- [e.g., "Locale string additions"].

**Out of Scope (confirm with stakeholder):**

- [Items that might be expected but should be separate].
- [e.g., "Performance optimisation beyond basic implementation"].

---

### 4. Top 3 Highest Risk Aspects

#### Risk #1: [Description]

**Category:** [Known Unknown | Technical Complexity | Integration Risk | etc.]

**Details:**

- [What makes this risky].
- [Potential impact].

**Mitigation:**

- [How to reduce this risk].

---

#### Risk #2: [Description]

**Category:** [Known Unknown | Technical Complexity | Integration Risk | etc.]

**Details:**

- [What makes this risky].
- [Potential impact].

**Mitigation:**

- [How to reduce this risk].

---

#### Risk #3: [Description]

**Category:** [Known Unknown | Technical Complexity | Integration Risk | etc.]

**Details:**

- [What makes this risky].
- [Potential impact].

**Mitigation:**

- [How to reduce this risk].

---

### 5. Overall Risk Level

**Risk Assessment: [Low | Medium | High]**

**Justification:**

- [Overall risk analysis].
- [Factors contributing to risk level].
- [Known unknowns summary].

**Risk Factors:**

- **Technical Risk:** [Low/Medium/High] - [Why].
- **Schedule Risk:** [Low/Medium/High] - [Why].
- **Integration Risk:** [Low/Medium/High] - [Why].
- **Requirement Risk:** [Low/Medium/High] - [Why].

**Confidence in Estimate:**

- [High/Medium/Low confidence and why].
- [What would increase confidence].

---

### Recommended Next Steps

1. [Immediate action item].
2. [Pre-implementation research needed].
3. [Stakeholder clarifications required].

---

## Implementation Decisions (Confirmed)

Based on stakeholder clarification on [date]:

1. **[Decision Area 1]**: [Chosen approach] ([Option letter]).
2. **[Decision Area 2]**: [Chosen approach] ([Option letter]).
3. **[Decision Area 3]**: [Chosen approach] ([Option letter]).

_Note: Include this section only if significant implementation choices were clarified during estimation._

---

**End of Report**

---

## Completion Checklist

**Cannot mark estimation complete until ALL checked:**

- [ ] User provided JIRA ticket content.
- [ ] All significant ambiguities identified and clarified with user.
- [ ] Codebase investigation completed using Explore agent.
- [ ] All sections of estimation report filled out.
- [ ] Complexity level justified with rationale.
- [ ] Time estimate includes breakdown and assumptions.
- [ ] Top 3 risks identified with mitigation strategies.
- [ ] Overall risk level assessed.
- [ ] Report reviewed for completeness and accuracy.

## Critical Rules

1. **NEVER skip ambiguity clarification** — If implementation choices significantly impact estimates, you MUST ask the user before proceeding using the **AskUserQuestion tool**. Better to pause for clarification than provide misleading estimates. Present options with their complexity/time impacts clearly described.

2. **Always use AskUserQuestion tool for ambiguities** — Do not use ad-hoc text conversation for clarifying implementation choices. Use the structured AskUserQuestion tool to present 1-4 ambiguities at once with clear options and impact descriptions.

3. **Always use Explore agent for codebase analysis** — Do not attempt complex codebase navigation manually. The Explore agent is optimised for this task.

4. **Be honest about uncertainty** — If confidence is low, say so clearly. Include what information would increase confidence.

5. **Consider the full scope** — Don't forget testing, documentation, review iterations, and framework wrappers. These often represent 40-50% of total effort.

6. **Account for unknowns** — Known unknowns should increase time estimates and risk levels proportionally.

7. **Use ranges, not point estimates** — Give ranges (e.g., "3-5 days") to reflect uncertainty, especially for complex work.

8. **Document assumptions explicitly** — Every estimate is based on assumptions. State them clearly so they can be validated.

## Failure Handling

### Problem: Insufficient ticket information

**Solution:**

- Request more details from user.
- List specific information needed.
- Provide estimate with large uncertainty range if user cannot provide more details.

### Problem: Cannot find relevant code areas

**Solution:**

- Use Explore agent with broader search patterns.
- Ask user for hints about where code might be located.
- Document this as a "known unknown" in the report.

### Problem: Multiple valid implementation approaches with vastly different complexity

**Solution:**

- Use the AskUserQuestion tool to present each approach as an option.
- Include complexity/time impact in each option's description.
- Provide recommendation in one option's description if applicable.
- Let user select their preferred approach through the structured interface.
- Document chosen approach in the "Implementation Decisions" section.

### Problem: Estimate exceeds reasonable time (e.g., >2 weeks for single person)

**Solution:**

- Consider if work should be broken into multiple tickets.
- Highlight this in the risk assessment.
- Recommend creating sub-tasks or phases.
- Discuss with user about scope reduction options.
