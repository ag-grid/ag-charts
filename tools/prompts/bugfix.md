1. If I didn't specify a JIRA, skip the following steps and warn me.

2. Move the JIRA to `In Progress`

3. Fulfilling the JIRA will be your primary focus.

4. Create a new branch with the JIRA issue number as the branch name and a short kebab case description of the change.

5. Review the JIRA and analyse the bug using `mcp-ag-jira`.

6. Execute the plan until the JIRA is complete.
    - Make sure all Acceptance Criteria are met if present.
    - Make sure all steps to reproduce have their expected results.
    - Use `mcp-browser` to exercise the changes.
        - If `mcp-browser` is not available, use `puppeteer` to exercise the changes.
7. Consider if CLAUDE.md needs updating.
8. Make sure changes meet the required code quality standards.
    - Always run all CI checks before committing (build, lint, test, etc).
    - Run the `./pr-review.md` prompt to review the changes.
