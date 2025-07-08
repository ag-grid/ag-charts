# PR Review Instructions

## General Workflow

Run this workflow if I ask you to review all open PRs.

-   Unless told otherwise, review open non-draft PRs against the `latest` branch.
-   The list of open PRs for `latest` is available at https://github.com/ag-grid/ag-charts/pulls?q=is%3Apr+is%3Aopen+base%3Alatest+draft%3Afalse
-   JIRA ticket URLs are of the form https://ag-grid.atlassian.net/browse/AG-XXXX
-   Use git commands to get the diff between the PR and the `latest` branch if that is the easiest way to read the changes.
-   Write a summary in ${REPO_ROOT}/reports/pr-reviews/${PR_NUMBER}.md
-   If there is already a summary report, check if it is up to date with the latest changes in the PR - skip the review if it is.
-   If a PR has been closed, move the report to ${REPO_ROOT}/reports/pr-reviews-archive/${PR_NUMBER}.md

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

## Report Structure

At the top of the report include:

-   Links to the PR and the JIRA ticket.
-   Author.
-   CI status.
-   Summary of the changes.
-   Breaking changes for users (contract changes in ag-charts-types, or behavioral changes elsewhere).
-   Things testers should be aware of and test.
-   Things the product manager should be aware of changing.
