# SonarCloud Issue Fixer

Systematically fetch and fix open SonarCloud issues for AG Charts packages.

## Usage

### Report Mode (No Arguments)

```
/sonar-fix
```

Shows summary of open SonarCloud issues with counts by severity and rule type.

### Fix Mode (With Arguments)

```
/sonar-fix <severity> [limit]
```

**Examples:**

-   `/sonar-fix HIGH` - Fix HIGH severity issues (default limit: 50)
-   `/sonar-fix HIGH 30` - Fix 30 HIGH severity issues
-   `/sonar-fix MEDIUM 20` - Fix 20 MEDIUM severity issues
-   `/sonar-fix ALL 100` - Fix up to 100 issues of all severities
-   `/sonar-fix HIGH,MEDIUM 50` - Fix HIGH and MEDIUM issues (up to 50 total)

---

## Rule Guide Library

Per-issue-type guides are available in `tools/prompts/sonar-fix/` directory:

-   **README.md** - Index of all available guides
-   **Individual guides** - Detailed fix patterns, examples, and AG Charts context for each rule type
-   Guides are automatically created/updated using the SonarCloud API when new rule types are encountered

## Instructions for AI Agent

### When Invoked WITHOUT Arguments (Report Mode)

1. **Fetch issues from SonarCloud API:**

    Use the WebFetch tool to retrieve issues:

    ```
    URL: https://sonarcloud.io/api/issues/search?s=FILE_LINE&issueStatuses=OPEN%2CCONFIRMED&ps=100&facets=impactSoftwareQualities%2CimpactSeverities&componentKeys=ag-charts-community-latest&organization=ag-grid&additionalFields=_all&impactSeverities=HIGH%2CMEDIUM%2CLOW%2CINFO

    Prompt: "Parse this SonarCloud issues response and extract:
    1. Total count of issues
    2. Breakdown by severity (HIGH, MEDIUM, LOW, INFO)
    3. Group issues by rule type (e.g., typescript:S3776, typescript:S7728)
    4. For each rule, show: count, total effort estimate, example message
    5. Return as structured markdown tables"
    ```

2. **Analyze and categorize issues:**

    Group issues by complexity tiers:

    - **Tier 1 (Quick Wins - Low Effort):**

        - S7728: Use `for...of` instead of `.forEach()`
        - S7726: Name anonymous functions
        - S7732: Prefer shorthand property notation
        - S1874: Remove deprecated API usage
        - Simple syntax/style fixes

    - **Tier 2 (Medium Effort):**

        - S3358: Extract ternary operators to if/else
        - S1854: Remove unused assignments
        - S4143: Deduplicate collection checks
        - S1871: Combine identical branches
        - Logic simplifications

    - **Tier 3 (Complex - High Effort):**
        - S3776: Reduce cognitive complexity
        - S1541: Reduce function complexity (lines of code)
        - Architectural refactors
        - May require significant code restructuring

3. **Generate formatted report:**

    ```markdown
    ## SonarCloud Issues Report

    **Total Issues:** N issues (~X hours estimated effort)

    ### Severity Breakdown

    | Severity | Count | Effort |
    | -------- | ----- | ------ |
    | HIGH     | N     | X hrs  |
    | MEDIUM   | N     | X hrs  |
    | LOW      | N     | X hrs  |
    | INFO     | N     | X min  |

    ### Top Issue Types (by count)

    | Rank | Rule  | Count | Tier | Auto-Fix | Effort | Description                        |
    | ---- | ----- | ----- | ---- | -------- | ------ | ---------------------------------- |
    | 1    | S7728 | 40    | 1    | ❌       | 3.5h   | Use for...of instead of .forEach() |
    | 2    | S3776 | 85    | 3    | ❌       | 18h    | Reduce cognitive complexity        |
    | 3    | S7726 | 10    | 1    | ❌       | 50min  | Name anonymous functions           |

    ### 🎯 Recommended Fix Strategy

    **Start with Tier 1 issues (quick wins):**

    -   S7728: 40 issues (~3.5 hours) - Loop syntax modernization
    -   S7726: 10 issues (~50 minutes) - Function naming

    **Then proceed to Tier 2 (medium effort):**

    -   S3358: 15 issues (~1 hour) - Simplify ternaries

    **Save Tier 3 for dedicated effort:**

    -   S3776: 85 issues (~18 hours) - Complexity reduction (requires careful refactoring)

    **To begin fixing:** `/sonar-fix HIGH 30`
    ```

4. **Include helpful context:**

    - Note which issues are in test files vs source files
    - Highlight any issues in recently modified files
    - Show package distribution (core, community, enterprise)
    - Link to SonarCloud project: `https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED`

---

### When Invoked WITH Arguments (Fix Mode)

#### Phase 0: Ensure Rule Guides Exist

**Before fetching issues, ensure rule-specific guides are available:**

1. **Check for existing guides:**

    Rule guides are located in `tools/prompts/sonar-fix/` directory.

    Each guide follows the naming pattern: `{rule-number}-{kebab-case-description}.md`

    Example: `S7728-use-for-of-loops.md`

2. **For missing guides:**

    If you encounter a rule type without a guide:

    a. **Fetch rule details from SonarCloud API:**

    ```
    URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid
    Example: https://sonarcloud.io/api/rules/show?key=typescript%3AS7728&organization=ag-grid

    Prompt: "Extract the complete rule information including:
    - Rule key, name, description
    - Severity, type, tags
    - All code examples (noncompliant and compliant)
    Return in structured format with all details"
    ```

    b. **Create guide file following the standard structure:**

    ```markdown
    # {Issue Description}

    Rule ID: {full-rule-id}
    Rule URL: https://sonarcloud.io/api/rules/show?key={encoded-rule-id}&organization=ag-grid

    {Human-readable description from SonarCloud API}

    ## Example Violations

    {Code examples from API}

    ## Example Fixes

    {Code examples from API}

    ## AG Charts Context

    {Project-specific notes - can be added incrementally}
    ```

    c. **Save to:** `tools/prompts/sonar-fix/{rule-number}-{description}.md`

    d. **Update README.md:** Add entry to the appropriate tier table in `tools/prompts/sonar-fix/README.md`

3. **Reference during fixing:**

    When processing issues in Phase 3, read the appropriate guide to inform your fixes.

#### Phase 1: Parse Arguments and Fetch Issues

1. **Parse command arguments:**

    ```
    Argument 1: Severity filter
    - HIGH → impactSeverities=HIGH
    - MEDIUM → impactSeverities=MEDIUM
    - LOW → impactSeverities=LOW
    - INFO → impactSeverities=INFO
    - HIGH,MEDIUM → impactSeverities=HIGH%2CMEDIUM
    - ALL → impactSeverities=HIGH%2CMEDIUM%2CLOW%2CINFO

    Argument 2: Limit (default: 50)
    - Maximum number of issues to fix in this session
    ```

2. **Fetch filtered issues:**

    ```
    URL: https://sonarcloud.io/api/issues/search?s=FILE_LINE&issueStatuses=OPEN%2CCONFIRMED&ps=100&facets=impactSoftwareQualities%2CimpactSeverities&componentKeys=ag-charts-community-latest&organization=ag-grid&additionalFields=_all&impactSeverities=<SEVERITY_FILTER>

    Prompt: "Extract all issues as a structured list with:
    - key: Issue unique identifier
    - rule: Rule ID (e.g., typescript:S7728)
    - component: Full file path (strip 'ag-charts-community-latest:' prefix)
    - line: Line number
    - message: Issue description
    - effort: Estimated fix time
    Return as parseable format (JSON or markdown table)"
    ```

    **Important:** If response has `paging.total > 100`, fetch additional pages by adding `&p=2`, `&p=3`, etc.

3. **Filter and prioritize:**

    - Apply the limit (default 50 issues)
    - Exclude test files if they dominate the list (configurable based on user preference)
    - Exclude generated files (common patterns: `*.generated.ts`, files with generation comments)
    - Group remaining issues by rule type for batch processing
    - Sort by complexity tier (Tier 1 → Tier 2 → Tier 3)

#### Phase 2: Present Plan to User

Create a detailed execution plan:

```markdown
## SonarCloud Fix Plan

**Scope:** N issues across M files (estimated X hours)

### Batch Breakdown

#### Batch 1: S7728 - Use for...of loops (15 issues, ~1.5h)

-   packages/ag-charts-core/src/utils/validation.ts (3 issues)
-   packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts (2 issues)
-   [... more files ...]

#### Batch 2: S7726 - Name anonymous functions (8 issues, ~40min)

-   packages/ag-charts-core/src/chart/data/processors.ts (5 issues)
-   [... more files ...]

#### Batch 3: S3358 - Simplify ternary operators (7 issues, ~35min)

-   [... files ...]

### Verification Strategy

After each batch:

-   ✅ Run `nx format` to ensure formatting
-   ✅ Run `nx lint <affected-packages>` to verify no new issues
-   ✅ Run `nx build:types <affected-packages>` to catch type errors
-   ✅ Create commit with descriptive message

### Skipped Issues (Tier 3 - Complex)

These require more careful refactoring and should be addressed separately:

-   S3776 (Cognitive Complexity): 85 issues (~18h effort)

**Proceed with this plan? (yes/no/modify)**
```

Wait for user confirmation before proceeding.

#### Phase 3: Systematic Fixing

**For each batch:**

1. **Create todo list for the batch:**

    Use TodoWrite to track progress:

    - Batch N: Fix <rule-name> issues
    - For each file in batch
    - Format code
    - Verify with lint/types
    - Commit changes

2. **Process each issue:**

    a. **Read the file and locate the issue:**

    ```bash
    # Read file with context around the issue line
    Read(<file_path>, offset=<line-5>, limit=20)
    ```

    b. **Verify issue still exists:**

    - Code may have changed since SonarCloud scan
    - Skip if already fixed

    c. **Apply rule-specific fix:**

    **Read the appropriate rule guide:**

    - Guides are in `tools/prompts/sonar-fix/{rule-number}-{description}.md`
    - Example: For rule `typescript:S7728`, read `tools/prompts/sonar-fix/S7728-use-for-of-loops.md`
    - Use the guide's examples, AG Charts context, and fix patterns to inform your changes
    - If no guide exists, create one following Phase 0 instructions

    **Quick reference patterns are also available below:** [Rule-Specific Fix Patterns](#rule-specific-fix-patterns)

    d. **Use Edit tool for precise changes:**

    - Keep changes minimal and focused
    - Preserve surrounding code style
    - Don't make unrelated changes

    e. **Mark todo as complete and move to next issue**

3. **After completing all issues in batch:**

    a. **Format code:**

    ```bash
    nx format
    ```

    b. **Identify affected packages:**

    Parse file paths to extract package names:

    - `packages/ag-charts-core/...` → `ag-charts-core`
    - `packages/ag-charts-community/...` → `ag-charts-community`
    - `packages/ag-charts-enterprise/...` → `ag-charts-enterprise`

    c. **Verify affected packages:**

    ```bash
    # Run for each affected package
    nx lint <package-name>
    nx build:types <package-name>
    ```

    d. **Check results:**

    - ✅ **If all pass:** Proceed to commit
    - ❌ **If verification fails:**
        - Review the errors
        - Fix any issues introduced by the changes
        - Re-run verification
        - If unable to fix, revert the batch and report to user

4. **Create commit:**

    ```bash
    git add <affected-files>

    git commit -m "$(cat <<'EOF'
    Fix SonarCloud <RULE_ID> issues

    Fixed N violations of <RULE_NAME> across M files.

    Changes:
    - <Brief description of the fix pattern>
    - <Package(s) affected>

    All tests passing, no functional changes.

    Rule: <RULE_ID> - <RULE_DESCRIPTION>
    EOF
    )"
    ```

5. **Report batch completion:**

    ```markdown
    ✅ Batch N Complete: <RULE_NAME>

    -   Fixed: N/N issues
    -   Files modified: M
    -   Verification: ✅ Passed
    -   Commit: <commit-hash>

    Remaining batches: X
    ```

6. **Move to next batch** and repeat

#### Phase 4: Final Report

After all batches complete:

```markdown
## 🎉 SonarCloud Fix Session Complete

### Summary

-   **Total Issues Fixed:** N/M (N fixed, M skipped)
-   **Files Modified:** X files across Y packages
-   **Commits Created:** Z commits
-   **Time Taken:** ~A minutes
-   **Estimated Effort Saved:** B hours

### Breakdown by Rule

| Rule  | Issues Fixed | Issues Skipped | Reason for Skip              |
| ----- | ------------ | -------------- | ---------------------------- |
| S7728 | 15           | 0              | -                            |
| S7726 | 8            | 2              | Already fixed in latest code |
| S3358 | 7            | 1              | Too complex, needs review    |

### Commits Created

1. Fix SonarCloud S7728 issues - <commit-hash>
2. Fix SonarCloud S7726 issues - <commit-hash>
3. Fix SonarCloud S3358 issues - <commit-hash>

### Remaining Issues

**Still open in SonarCloud:** M issues

-   HIGH: X issues (~Y hours)
-   MEDIUM: X issues (~Y hours)
-   Tier 3 (Complex): Z issues (~W hours)

**Recommendations:**

-   Consider running `/sonar-fix HIGH` again to tackle more issues
-   Tier 3 complexity issues need dedicated refactoring effort
-   Verify changes with `nx test ag-charts-community` and `nx test ag-charts-enterprise`

**SonarCloud Link:** https://sonarcloud.io/project/issues?id=ag-charts-community-latest&issueStatuses=OPEN%2CCONFIRMED
```

---

## Rule-Specific Fix Patterns

### S7728: Use for...of instead of .forEach()

**Before:**

```typescript
items.forEach((item) => {
    process(item);
});
```

**After:**

```typescript
for (const item of items) {
    process(item);
}
```

**Special cases:**

-   If callback uses `this` context → Keep `.forEach()` with arrow function or add comment
-   If callback has early returns → Use `for...of` with continue/break
-   If index is needed → Use `for (const [index, item] of items.entries())`

### S7726: Name anonymous functions

**Before:**

```typescript
const handler = function () {
    // ...
};
```

**After:**

```typescript
const handler = function handler() {
    // ...
};
```

**Context:** Improves stack traces and debugging

### S3776: Reduce cognitive complexity

This is a **Tier 3** issue requiring careful refactoring. Common approaches:

1. **Extract helper functions:**

    ```typescript
    // Before: One large function with nested ifs
    function process(data) {
      if (condition1) {
        if (condition2) {
          if (condition3) {
            // ... deep nesting
          }
        }
      }
    }

    // After: Extracted helpers
    function process(data) {
      if (!shouldProcess(data)) return;
      processValidData(data);
    }

    function shouldProcess(data) {
      return condition1 && condition2 && condition3;
    }
    ```

2. **Use early returns:**

    ```typescript
    // Before: Deep nesting
    if (valid) {
      if (hasData) {
        // ... lots of logic
      }
    }

    // After: Early returns
    if (!valid) return;
    if (!hasData) return;
    // ... logic at top level
    ```

3. **Simplify boolean logic:**

    ```typescript
    // Before: Complex conditions
    if (a && b || c && d || e && f) { ... }

    // After: Named helper
    const shouldProceed = meetsConditionA() || meetsConditionB() || meetsConditionC();
    if (shouldProceed) { ... }
    ```

**Note:** Only attempt S3776 fixes if effort estimate is < 15 minutes. Larger refactors should be done in dedicated tasks.

### S3358: Ternary operators should not be nested

**Before:**

```typescript
const result = condition1 ? (condition2 ? value1 : value2) : condition3 ? value3 : value4;
```

**After:**

```typescript
let result;
if (condition1 && condition2) {
    result = value1;
} else if (condition1) {
    result = value2;
} else if (condition3) {
    result = value3;
} else {
    result = value4;
}
```

Or extract to a helper function:

```typescript
const result = determineResult(condition1, condition2, condition3);
```

### S1854: Remove unused assignments

**Before:**

```typescript
let value = calculateInitial();
value = calculateFinal(); // First assignment never used
```

**After:**

```typescript
let value = calculateFinal();
```

**Note:** Ensure removing the assignment doesn't affect side effects

---

## Component Key Reference

SonarCloud uses these component keys:

-   `ag-charts-community-latest` (default) - Community package
-   `ag-charts-enterprise-latest` - Enterprise package
-   Additional packages may be added in the future

The API returns paths like:

```
ag-charts-community-latest:packages/ag-charts-core/src/utils/validation.ts
```

Strip the prefix to get the actual file path:

```
packages/ag-charts-core/src/utils/validation.ts
```

---

## Important Notes

### Safety and Verification

-   ✅ **Always format after changes:** Use `nx format` to ensure consistency
-   ✅ **Verify each batch:** Run lint and type checks for affected packages
-   ✅ **Commit frequently:** One commit per batch for easy rollback
-   ✅ **Read file context:** Always read surrounding code before making changes
-   ✅ **Preserve style:** Match existing code style and patterns
-   ❌ **Never batch-modify** without reading each file individually
-   ❌ **Don't fix issues blindly** - verify they still exist in current code
-   ❌ **Avoid complex refactors** in quick-fix mode - flag for separate tasks

### When to Skip Issues

-   **Already fixed:** Issue no longer exists in current codebase
-   **Generated code:** Files with generation markers or in generated directories
-   **Test-specific patterns:** Some patterns are acceptable in tests
-   **Complex refactoring needed:** Effort > 15 minutes per issue
-   **Requires architectural changes:** Better as dedicated task

### Error Recovery

If verification fails:

1. Review the specific errors
2. Attempt to fix the introduced issues
3. Re-run verification
4. If unable to fix within 2-3 attempts:
    - Revert the entire batch: `git reset --hard HEAD~1`
    - Report to user which batch failed and why
    - Continue with next batch if user confirms

### Testing Recommendations

After fixing significant numbers of issues:

```bash
# Run core tests
nx test ag-charts-community
nx test ag-charts-enterprise

# Run builds
nx build ag-charts-community
nx build ag-charts-enterprise

# Run benchmarks if performance-related rules were fixed
nx benchmark ag-charts-community -- -t "pattern"
```

---

## Common Issues & Troubleshooting

### Issue: WebFetch returns incomplete data

**Solution:**

-   Check if `paging.total > paging.pageSize`
-   Fetch additional pages with `&p=2`, `&p=3`, etc.
-   Combine results from all pages

### Issue: File path not found

**Solution:**

-   Verify the component prefix was stripped correctly
-   Check if file was moved/deleted since SonarCloud scan
-   Skip the issue and note it in the report

### Issue: Fix breaks tests

**Solution:**

-   Review the specific fix pattern used
-   Check if the code had hidden side effects
-   Revert the change and add to "requires manual review" list
-   Note the issue in final report

### Issue: Too many issues in one rule

**Solution:**

-   Process in smaller batches (use the limit parameter)
-   Run `/sonar-fix HIGH 20` multiple times
-   Focus on specific packages if needed

### Issue: SonarCloud API rate limiting

**Solution:**

-   The API is public and unauthenticated, rate limits are generous
-   If hit, wait briefly and retry
-   Reduce batch size to minimize API calls

---

## Workflow Summary

```
┌─────────────────────────────────────┐
│ /sonar-fix                          │
│ (Report Mode)                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Fetch All Issues                    │
│ Group by Rule & Tier                │
│ Show Summary Report                 │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│ /sonar-fix HIGH 30                  │
│ (Fix Mode)                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Fetch Filtered Issues (HIGH, 30)   │
│ Group by Rule & Prioritize          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Present Plan → User Approval        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ For Each Batch:                     │
│  1. Fix issues in batch             │
│  2. Format code                     │
│  3. Verify (lint + types)           │
│  4. Commit                          │
│  5. Report progress                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Generate Final Report               │
│ Show stats, commits, remaining      │
└─────────────────────────────────────┘
```

---

## Integration with Existing Workflows

This command complements existing tools:

-   **`/lint-fix`** - For ESLint rules (local linting)
-   **`/sonar-fix`** - For SonarCloud issues (cloud-based static analysis)
-   **`/pr-review`** - For reviewing PRs (can check if SonarCloud issues were addressed)

Consider running both `/lint-fix` and `/sonar-fix` as part of regular code quality maintenance.
