# SonarCloud Issue Fix Guides

This directory contains per-issue-type guides for fixing SonarCloud violations in AG Charts.

## Purpose

Each guide provides:

-   **Rule Description**: Official SonarCloud rule documentation
-   **Example Violations**: Code patterns that trigger the rule
-   **Example Fixes**: How to correctly resolve the issue
-   **AG Charts Context**: Project-specific guidance and common patterns

## Guide Structure

All guides follow this standard format:

```markdown
# {Issue Description}

Rule ID: {full-rule-id}
Rule URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid

{Human-readable description}

## Example Violations

{Code examples of violations}

## Example Fixes

{Code examples of fixes}

## AG Charts Context

{Project-specific notes}
```

## Available Guides

### Tier 1 (Quick Wins - Low Effort)

| Rule ID | File                             | Description                             | Auto-Fix | Effort/Issue |
| ------- | -------------------------------- | --------------------------------------- | -------- | ------------ |
| S7726   | [S7726-default-exports-named.md] | Default exports should be named         | ❌       | ~5min        |
| S7728   | [S7728-use-for-of-loops.md]      | Use for...of instead of forEach         | ❌       | ~5min        |
| S7732   | [S7732-shorthand-properties.md]  | Prefer shorthand property notation      | ❌       | ~2min        |
| S7772   | [S7772-node-protocol.md]         | Use "node:" protocol for Node.js import | ❌       | ~2min        |
| S7773   | [S7773-number-static-methods.md] | Prefer Number static methods            | ❌       | ~3min        |
| S1874   | [S1874-deprecated-api.md]        | Remove deprecated API usage             | ❌       | ~10min       |

### Tier 2 (Medium Effort)

| Rule ID | File                                   | Description                            | Auto-Fix | Effort/Issue |
| ------- | -------------------------------------- | -------------------------------------- | -------- | ------------ |
| S3358   | [S3358-nested-ternary.md]              | Avoid nested ternary operators         | ❌       | ~5min        |
| S1854   | [S1854-unused-assignments.md]          | Remove unused assignments              | ❌       | ~5min        |
| S4143   | [S4143-duplicate-collection-checks.md] | Deduplicate collection checks          | ❌       | ~10min       |
| S1871   | [S1871-identical-branches.md]          | Combine identical conditional branches | ❌       | ~10min       |

### Tier 3 (Complex - High Effort)

| Rule ID | File                            | Description                 | Auto-Fix | Effort/Issue |
| ------- | ------------------------------- | --------------------------- | -------- | ------------ |
| S3776   | [S3776-cognitive-complexity.md] | Reduce cognitive complexity | ❌       | ~15-60min    |
| S1541   | [S1541-function-complexity.md]  | Reduce function size (LOC)  | ❌       | ~30-120min   |

## Creating New Guides

When encountering a new rule type:

1. **Fetch rule data from SonarCloud API:**

    ```bash
    # Replace S7726 with the actual rule number
    curl "https://sonarcloud.io/api/rules/show?key=typescript:S7726&organization=ag-grid"
    ```

2. **Create guide file:**

    - File name: `{rule-number}-{kebab-case-description}.md`
    - Example: `S7726-default-exports-named.md`

3. **Follow the standard structure** (see above)

4. **Add entry to this README** in the appropriate tier table

5. **Test the guide** by using it to fix actual issues in the codebase

## Usage in /sonar-fix Command

The `/sonar-fix` command automatically:

1. Identifies unique rule types in open issues
2. Checks if guides exist for each rule
3. Creates missing guides using SonarCloud API
4. References guides during the fixing process

## Maintenance

-   **Review guides quarterly** to ensure accuracy with latest SonarCloud rules
-   **Update AG Charts Context** sections as project patterns evolve
-   **Add real examples** from actual fixes to improve guide quality

## Links

-   [SonarCloud AG Charts Project](https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED)
-   [SonarCloud Rules API](https://sonarcloud.io/web_api/api/rules)
-   [/sonar-fix Command Documentation](../commands/sonar-fix.md)
