1. Fulfilling JIRA ${ARGUMENTS} will be your primary focus.

2. Move the JIRA to `In Progress`

3. Create a new branch with the JIRA issue number as the branch name and a short kebab case description of the change.

4. Review the JIRA and analyse the bug using the `ag-jira` tool.

5. Execute the plan until the JIRA is complete.
    - Make sure all Acceptance Criteria are met if present.
    - Make sure all steps to reproduce have their expected results.
    - Use the puppeteer tool to exercise the changes.
6. Consider if CLAUDE.md needs updating.
7. Make sure changes meet the required code quality standards.
    - Always run all CI checks before committing (build, lint, test, etc).
    - Run the `./pr-review.md` prompt to review the changes.
