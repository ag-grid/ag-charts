# PR Review Instructions

## 0. IMPORTANT FILE/PROMPT/AGENT LOCATIONS IF YOU ARE NOT CLAUDE CODE

```bash
${REPO_ROOT}/tools/prompts # Partial relevant directory listing.
├── agents  # Files here are agents that you can invoke.
│   ├── code-reviewer.md
│   ├── data-viz-designer.md
│   ├── example-tester.md
│   └── visual-qa.md
├── CLAUDE.md  # Context for working with the entire repo.
└── commands  # Files here are commands that you can invoke.
    ├── pr-review.md
    └── previs.md
```

If `claude` is installed, this folder structure may also be symlinked from `%{REPO_ROOT}/.claude/`.

## 1. General Context

-   The `ag-charts` project is a monorepo with multiple packages.
-   The `ag-charts-types` package is the public API contract for the `ag-charts` project.
-   Release branches are named `b12.0.0` and follow semantic versioning.
    -   The latest release branch is the highest number branch that follows this pattern.

## 2. Workflows and criteria

### General Workflow

1. Identify PRs to review (see Identifying sections below.).
2. For each PR they must (unless otherwise specified):
    - meet the reviewable PR criteria (see Reviewable PR criteria below)
    - meet the report generation pre-requisites (see Report Generation Pre-requisites below)
3. Generate a report for each PR `${REPO_ROOT}/reports/pr-reviews/${PR_NUMBER}-${JIRA_ID:-none}.md` (see Report output definitions below).
4. Archive stale reports for closed PRs (see Report output definitions below).
5. Concisely summarize the list of reports generated (PR number + path to report).

### Identifying single/specific PRs

If I specify to review specific PRs ($ARGUMENTS), just perform review for them without searching in JIRA or GitHub.

### Identifying all open PRs

-   Review open PRs for the `ag-charts` project which meet the reviewable PR criteria and report generation pre-requisites (unless otherwise specified).

### Identifying PRs for JIRA tickets

-   Use the MCP server `ag-jira` to search for JIRA tickets.
-   Unless requested otherwise:
    -   We're only interested in tickets in the `AG` project with a component of `Charts`.
    -   We're usually interested in tickets with a status of `Needs Review`.
-   JIRAs will have comments with links to PRs that potentially need review.
    -   PRs that meet the reviewable PR criteria will be reviewed.

### Reviewable PR criteria

PRs are reviewable if they meet these criteria (unless otherwise specified):

-   Having base branch of `latest`.
-   Being not a draft.
-   Being open.
-   Being not closed.

### Report Generation Pre-requisites

Unless I explicitly ask you to review a specific PR:

-   Check if there is an existing report for the PR, and if so, check if the PR has been updated since the report was generated.
    -   If the report is stale, perform a re-review.
    -   If these report instructions have changed since the report was generated, perform a re-review.
    -   Otherwise skip the report generation.

## 3. Report output definitions

### Report file paths

-   Reports must have a filename of the form `${PR_NUMBER}-${JIRA_ID:-none}.md`.
-   Use `${REPO_ROOT}/reports/pr-reviews/tmp/` to store intermediate files such as the diff between the PR and the `latest` branch.
-   Use `${REPO_ROOT}/reports/pr-reviews/` to store the final report.
-   Use `${REPO_ROOT}/reports/pr-reviews-archive/` to store archived reports for closed PRs.

### Archive reports for closed PRs

-   If a PR is closed, move the report to `${REPO_ROOT}/reports/pr-reviews-archive/`

## 4. Report criteria

For each PR, review and critique the following:

-   Does the PR have a subject which has a JIRA identifier?
-   Does the subject capture the main changes in the PR?
-   Does the PR have a JIRA ticket?
-   Focusing only on the changed lines in the PR:
    -   Are the changes logically correct?
    -   Does the code style match the adjacent code?
    -   Are there any misplaced or changed responsibilities?
    -   Are there any performance regressions?
    -   Are there any other risks with the changes?
    -   Should we add more tests?
-   For visual snapshot changes, follow the comprehensive visual snapshot review process:

    ### Visual Snapshot Review Process

    1. **Pre-Analysis Phase**
        - Analyze the PR's code changes to identify:
            - Which chart types/components were modified
            - What visual changes are expected based on the code changes
            - Any rendering logic, styling, or layout modifications
        - Create a manifest of expected visual impacts
    2. **Snapshot Categorization**
        - Group snapshots by:
            - Chart type (bar, line, scatter, etc.)
            - Component (axis, legend, tooltip, etc.)
            - Test category (basic rendering, interactions, edge cases)
        - Identify which snapshots correspond to modified code
        - Flag snapshots from unmodified components for regression checking
    3. **Visual-QA Agent Instructions**
       When invoking the visual-qa agent, provide:
        - The PR diff and summary of code changes
        - The manifest of expected visual changes
        - Specific areas of focus based on modified code
        - Instructions to categorize changes as:
            - **Expected**: Changes directly correlating to code modifications
            - **Possibly Expected**: Changes in related components that might be side effects
            - **Unexpected**: Changes in unmodified components or unrelated features
            - **Regression**: Breaking changes that degrade visual quality
    4. **Prioritized Review Strategy**
       For large snapshot sets (100+ images):
        - **Priority 1**: Review all snapshots for directly modified components
        - **Priority 2**: Sample 20% of snapshots from indirectly affected components
        - **Priority 3**: Sample 5% of snapshots from unmodified components
        - **Always Review**: Any flagged regressions or unexpected changes
    5. **Validation Criteria**
       Visual changes are considered acceptable if they:
        - Align with the PR's stated purpose
        - Don't introduce visual regressions (misalignment, clipping, rendering artifacts)
        - Maintain consistency across similar chart types
        - Don't break existing visual features unless intentionally deprecated
    6. **Report Requirements**
       The visual review section should include:
        - Summary of snapshot changes (total count, categorized by expected/unexpected)
        - Detailed analysis of any unexpected changes
        - Visual regression risks assessment
        - Recommendations for additional manual review if needed

-   If there is a code-reviewer agent, ask it to review the changes and provide a distinct detailed report in `${REPO_ROOT}/reports/pr-reviews/${PR_NUMBER}-${JIRA_ID:-none}-detailed-code-review.md` and link it in the main report.
-   For examples and documentation changes, check for any offensive language or politically charged language that could be offensive to some users.

## 5. Report Structure

-   Status Section

    -   Links to the PR and the JIRA ticket(s).
    -   Author.
    -   CI status.
    -   Last review date/time.
    -   Last PR update date/time.

-   Analysis Section

    -   Summary of the changes.
    -   The main body of the report focusing on the review criteria.
    -   If there are visual snapshot changes:
        -   Provide a summary table: Total snapshots | Expected | Possibly Expected | Unexpected | Regressions
        -   List the most significant visual changes with categorization
        -   For unexpected changes, provide detailed analysis including:
            -   Which component/chart type
            -   Nature of the change
            -   Potential cause based on code analysis
            -   Risk assessment
        -   Include links to the visual-qa agent's detailed report if generated

-   For stakeholder attention section:
    -   Breaking TypeScript or behavior changes for users:
        -   We ONLY care about TypeScript contract changes in `ag-charts-types` since the latest release, as this is our external API contract.
        -   We DO NOT care about other interface or contract changes as these are internally used and not part of our external API contract.
        -   Behavioral changes in `ag-charts-community` or `ag-charts-enterprise`.
    -   Points of interest for the QA team.
    -   Points of interest for the Product Manager.
