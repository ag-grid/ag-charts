# PR Review Instructions

## Context

### Open PRs for latest branch

Unless I specify to review specific PRs ($ARGUMENTS), the list of open PRs for `latest` is available at https://github.com/ag-grid/ag-charts/pulls?q=is%3Apr+is%3Aopen+base%3Alatest+draft%3Afalse

### JIRA ticket search

When searching for JIRA tickets using the MCP server `mcp-ag-jira`, unless requested otherwise on this project we're only interested in tickets in the `AG` project with a component of `Charts`.

When searching for JIRA tickets that need review, we're usually interested in tickets with a status of `Needs Review`.

### JIRA ticket URLs

JIRA ticket URLs are of the form https://ag-grid.atlassian.net/browse/AG-XXXX

### Review related files

-   Use `${REPO_ROOT}/reports/pr-reviews/tmp/` to store intermediate files such as the diff between the PR and the `latest` branch.
-   Use `${REPO_ROOT}/reports/pr-reviews/` to store the final report.
-   Use `${REPO_ROOT}/reports/pr-reviews-archive/` to store archived reports for closed PRs.

### Review output

-   Write a summary in `${REPO_ROOT}/reports/pr-reviews/${PR_NUMBER}-${JIRA_ID:-none}.md`.
-   Check for stale reports; if a PR is closed, move the report to ${REPO_ROOT}/reports/pr-reviews-archive/${PR_NUMBER}-${JIRA_ID:-none}.md

### PR Review Pre-requisites

Unless I explicitly ask you to review a specific PR:

-   Check the PR is open.
-   Check the PR is not a draft.
-   Check the PR is against the `latest` branch unless otherwise specified.
-   Check if there is an existing report for the PR, and if so, check if the PR has been updated since the report was generated.
    -   If the report is stale, perform a re-review.
    -   If these report instructions have changed since the report was generated, perform a re-review.
    -   Otherwise

## General JIRA Ticket Review Workflow

Run this workflow if I ask you to perform reviews.

-   Find JIRA tickets that need review.
-   For each JIRA ticket:
    -   If there is a recently linked PR that hasn't been merged, perform PR review.

## General PR Review Workflow

Run this workflow if I ask you to review all open PRs.

-   Clean up stale reports for closed PRs.
-   Unless told otherwise, review open non-draft PRs against the `latest` branch.
-   Use the `mcp-github` MCP server if available, otherwise use `git` or `gh` commands to get the diff between the PR and the `latest` branch.

## Review Criteria

For each PR, review and critique the following:

-   Does the PR have a subject which has a JIRA identifier?
-   Doe the subject capture the main changes in the PR?
-   Focusing only on the changed lines in the PR:
    -   Are the changes logically correct?
    -   Does the code style match the adjacent code?
    -   Are there any misplaced or changed responsibilities?
    -   Are there any performance regressions?
    -   Are there any other risks with the changes?
    -   Should we add more tests?
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
    -   Breaking changes for users, focusing on:
        -   Contract changes in our public API contract in `ag-charts-types`.
        -   Behavioral changes elsewhere.
        -   DO NOT include other interface changes as we don't support users depending on these.
    -   Points of interest for the QA team.
    -   Points of interest for the Product Manager.
