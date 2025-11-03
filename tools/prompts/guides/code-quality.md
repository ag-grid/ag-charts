# Code Quality Guide

This guide covers code quality practices, including avoiding code bloat, comment guidelines, and code review practices.

## Avoid Code Bloat

-   **No redundant computed values**: Store only base data, compute derived properties via functions/getters
-   **No dead code**: Remove unused methods, parameters, or properties
-   **Extract duplication**: If the same logic appears twice, extract it to a helper function
-   **Simplify conditionals**: Consolidate repeated if/else branches, use early returns
-   **Serialize cleanly**: Add `toJSON()` methods to classes to avoid exposing internal structure in snapshots

## Comment Guidelines

-   **Explain WHY, not WHAT**: Code should be self-documenting; comments explain reasoning
-   **Keep OPTIMIZATION comments**: These explain performance trade-offs and design decisions
-   **Concise JSDoc**: Simple getters/setters don't need JSDoc; complex methods do
-   **Remove obvious comments**: Don't restate what the code clearly shows
-   **Trust good naming**: Well-named variables and methods reduce need for comments
-   **Examples in JSDoc**: Complex methods benefit from usage examples in documentation

## Code Review Guidelines

-   When reviewing a PR, don't comment on lines not changed in the PR itself; we have tech-debt but can't fix it all at once.
-   **For test changes**:
    -   Ensure tests exercise real implementations, not test-only helper functions
    -   Verify consistency: if similar tests check X, all related tests should check X
    -   Look for opportunities to improve test coverage without adding redundancy
-   **For documentation changes**:
    -   Follow [Documentation Pages Guide](./docs-pages.md) for structure and patterns
    -   Ensure examples are framework-compatible (see [Examples Guide](./examples.md))
    -   Verify technical accuracy against TypeScript definitions
-   See `tools/prompts/commands/pr-review.md` for detailed PR review instructions.

## Related Resources

- [Documentation Pages Guide](./docs-pages.md) - Documentation quality standards
- [Examples Guide](./examples.md) - Example code quality requirements
- [Testing Guide](./testing.md) - Test quality standards

## Self-Review Before Committing

-   Read through your changes as if you were the reviewer
-   Check for consistency with similar existing code patterns
-   For test changes, verify completeness by comparing with related tests in the same file
-   Ensure naming clearly conveys intent (especially for boolean/flag variables)

## Essential Quality Commands

-   `nx format` – format repo files; run from the project root before committing
-   `nx build:types <package>` – regenerate declaration files when touching exported APIs
-   `nx lint <package>` – apply ESLint and custom rules before final review

## Formatting Best Practice

-   Make sure to run `nx format` on any changes to ensure consistent formatting before commit
-   Prefer running `nx format` in the root of the repo to format changes, as there are config nuances that aren't taken into account when directly running tooling in more specific places
