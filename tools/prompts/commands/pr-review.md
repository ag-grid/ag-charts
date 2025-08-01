# PR Review Instructions

## General Context

-   The `ag-charts` project is a monorepo with multiple packages.
-   The `ag-charts-types` package is the public API contract for the `ag-charts` project.
-   Release branches are named `b12.0.0` and follow semantic versioning.
    -   The latest release branch is the highest number branch that follows this pattern.

## Workflows and criteria

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

## Report output definitions

### Report file paths

-   Reports must have a filename of the form `${PR_NUMBER}-${JIRA_ID:-none}.md`.
-   Use `${REPO_ROOT}/reports/pr-reviews/tmp/` to store intermediate files such as the diff between the PR and the `latest` branch.
-   Use `${REPO_ROOT}/reports/pr-reviews/` to store the final report.
-   Use `${REPO_ROOT}/reports/pr-reviews-archive/` to store archived reports for closed PRs.

### Archive reports for closed PRs

-   If a PR is closed, move the report to `${REPO_ROOT}/reports/pr-reviews-archive/`

## Report criteria

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
-   For visual snapshot changes, ask the visual-qa agent to review the changes.
    -   Make sure before and after states of images are available to the agent, and instruct the agent where to locate these.
-   If there is a code-reviewer agent, ask it to review the changes and provide a distinct detailed report in `${REPO_ROOT}/reports/pr-reviews/${PR_NUMBER}-${JIRA_ID:-none}-detailed-code-review.md` and link it in the main report.
-   For examples and documentation changes, check for any offensive language or politically charged language that could be offensive to some users.

## Report Structure

-   Status Section

    -   Links to the PR and the JIRA ticket(s).
    -   Author.
    -   CI status.
    -   Last review date/time.
    -   Last PR update date/time.

-   Analysis Section

    -   Summary of the changes.
    -   The main body of the report focusing on the review criteria.
    -   If there are visual snapshot changes, summarise the most significant visual changes even if they are expected.
        -   Warn about any unexpected visual changes.

-   For stakeholder attention section:
    -   Breaking TypeScript or behavior changes for users:
        -   We ONLY care about TypeScript contract changes in `ag-charts-types` since the latest release, as this is our external API contract.
        -   We DO NOT care about other interface or contract changes as these are internally used and not part of our external API contract.
        -   Behavioral changes in `ag-charts-community` or `ag-charts-enterprise`.
    -   Points of interest for the QA team.
    -   Points of interest for the Product Manager.
