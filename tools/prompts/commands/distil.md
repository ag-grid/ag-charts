# Distil Code Quality - Reduce Bloat and Productionize

You are an expert software engineer and clean-code advocate with deep expertise in identifying and removing code bloat, redundant code, and unnecessary comments.

Your goal is to review changes on the current branch and productionize the code by removing bloat, duplication, and improving clarity.

## Help

If the user provides a command option of `help`:

-   Explain how to use this prompt.
-   Explain if they are missing any prerequisites or tooling requirements.
-   DO NOT proceed, exit the prompt immediately after these steps.

## 1. IMPORTANT TOOLING REQUIREMENTS - STOP IF THESE ARE NOT MET

-   Git CLI must be available to determine the current branch and base branch.
-   The working tree should be clean or have only the intended changes.

## 2. General Context

-   The `ag-charts` project is a monorepo with multiple packages.
-   Release branches are named `b12.0.0` and follow semantic versioning.
-   The main branch is `latest`.
-   Code quality standards are documented in `tools/prompts/guides/code-quality.md`.

## 3. Workflow

### Phase 0: Determine Scope

1. **Identify current branch and base branch:**

    ```bash
    # Get current branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $current_branch"

    # Determine base branch (latest or most recent release branch)
    # First try to find the merge-base with latest
    if git merge-base --is-ancestor latest HEAD 2>/dev/null; then
        base_branch="latest"
    else
        # Check for release branches (bX.Y.Z pattern)
        release_branches=$(git branch -r | grep -E 'origin/b[0-9]+\.[0-9]+\.[0-9]+$' | sed 's/.*origin\///' | sort -V | tail -1)
        if [ -n "$release_branches" ]; then
            base_branch="$release_branches"
        else
            base_branch="latest"
        fi
    fi

    echo "Base branch: $base_branch"
    ```

2. **Get the diff of changes:**

    ```bash
    # Get list of changed files
    git diff --name-only "$base_branch"...HEAD

    # Get full diff
    git diff "$base_branch"...HEAD
    ```

3. **Verify working tree status:**

    ```bash
    git status
    ```

    If there are uncommitted changes, ask the user if they want to:

    - Stash changes and distil committed changes only
    - Include uncommitted changes in the distillation
    - Stop and let them commit first

### Phase 1: Analysis

For each changed file in the diff, analyze for:

1. **Code Bloat:**

    - **Redundant computed values**: Are there stored values that should be computed via functions/getters?
    - **Dead code**: Unused methods, parameters, properties, imports?
    - **Oversized functions**: Functions that do too much and should be split?
    - **Unnecessary abstractions**: Over-engineering for simple cases?

2. **Duplication:**

    - **Repeated logic**: Same code pattern appearing multiple times?
    - **Similar conditionals**: Multiple if/else branches that could be consolidated?
    - **Copy-pasted code blocks**: Opportunities to extract to helper functions?

3. **Comments:**

    - **Redundant comments**: Comments that restate what the code clearly shows?
    - **WHAT vs WHY**: Comments explaining what the code does instead of why?
    - **Obvious JSDoc**: Simple getters/setters with unnecessary documentation?
    - **Outdated comments**: Comments that no longer match the code?
    - **KEEP optimization comments**: These explain performance trade-offs and are valuable

4. **Code Clarity:**

    - **Complex conditionals**: Can be simplified with early returns or helper methods?
    - **Poor naming**: Variables/methods that don't clearly convey intent?
    - **Magic numbers/strings**: Hard-coded values that should be named constants?
    - **Nested ternaries**: Should be converted to if/else or helper functions?

5. **Production Readiness:**

    - **Console logs/debugger statements**: Debug code that should be removed?
    - **TODO/FIXME comments**: Items that should be addressed or converted to JIRA tickets?
    - **Test-only code in production**: Helper functions only used in tests?
    - **Incomplete error handling**: Missing error cases or validation?

### Phase 2: Categorize Issues

Group findings into categories:

-   **Critical (must fix before production):**

    -   Debug code (console.log, debugger)
    -   Dead/unreachable code
    -   Security issues
    -   Breaking changes without proper migration

-   **High Priority (code bloat):**

    -   Duplication (DRY violations)
    -   Redundant computed values
    -   Oversized functions (>50 lines with multiple responsibilities)
    -   Unused imports/parameters/methods

-   **Medium Priority (clarity):**

    -   Redundant/obvious comments
    -   Complex conditionals
    -   Poor naming
    -   Magic numbers/strings

-   **Low Priority (polish):**
    -   Formatting inconsistencies (will be caught by `nx format`)
    -   Minor style improvements
    -   Optional JSDoc improvements

### Phase 3: Present Plan

Create a detailed plan showing:

```markdown
## Code Distillation Plan - ${current_branch}

**Base branch:** ${base_branch}
**Changed files:** N files
**Total issues found:** M issues

### Critical Issues (Must Fix)

#### File: path/to/file.ts

-   Line 42: Remove console.log statement
-   Line 89: Remove debugger statement

### High Priority Issues (Code Bloat)

#### File: path/to/file.ts

-   Lines 15-30: Duplicate logic - extract to helper function `calculateTotal()`
-   Lines 45-60: Duplicate logic - same pattern, reuse helper
-   Line 78: Unused import `import { unused } from './utils'`
-   Lines 100-150: Function `processData()` does too much - consider splitting

### Medium Priority Issues (Clarity)

#### File: path/to/file.ts

-   Line 23: Remove redundant comment `// Set value to 0` (code is self-explanatory)
-   Line 55: Simplify nested ternary to if/else
-   Line 67: Replace magic number `1000` with named constant `MILLISECONDS_PER_SECOND`

### Low Priority Issues (Polish)

#### File: path/to/file.ts

-   Line 12: Unnecessary JSDoc on simple getter
-   Line 34: Variable `tmp` could be more descriptive

### Preservation Notes

These will be KEPT (no changes):

-   Optimization comments in file.ts (lines 42, 88)
-   Performance-critical code patterns (even if they look "unclear")
-   Existing TODOs with JIRA references (AG-12345)

---

**Estimated effort:** X minutes
**Recommend proceeding in batches?** Yes/No
**Safe to auto-apply?** Yes/No (if No, will request approval per change)

**Proceed with this plan?** (yes/no/modify)
```

Wait for user confirmation before proceeding.

### Phase 4: Apply Fixes

For each category (Critical → High → Medium → Low):

1. **Read the full file context** (not just the diff) to understand surrounding code
2. **Apply fixes one category at a time**
3. **After each category:**
    ```bash
    # Format
    nx format
    # Lint affected packages
    nx lint <affected-package>
    # Type check
    nx build:types <affected-package>
    ```
4. **Verify no new issues introduced**
5. **Continue to next category**

**Important Fix Patterns:**

-   **Duplication Extraction:**

    ```typescript
    // Before: Duplicated logic
    function processA() {
        const result = data.map(x => x * 2).filter(x => x > 10);
        return result;
    }
    function processB() {
        const result = data.map(x => x * 2).filter(x => x > 10);
        return result;
    }

    // After: Extracted helper
    function transformAndFilter(data: number[]) {
        return data.map(x => x * 2).filter(x => x > 10);
    }
    function processA() {
        return transformAndFilter(data);
    }
    function processB() {
        return transformAndFilter(data);
    }
    ```

-   **Redundant Comments:**

    ```typescript
    // Before: Obvious comment
    // Set the value to 0
    this.value = 0;

    // After: No comment needed
    this.value = 0;

    // Before: WHAT instead of WHY
    // Loop through items and process each one
    for (const item of items) {
        process(item);
    }

    // After: Explain WHY if needed
    // Process items sequentially to avoid race conditions
    for (const item of items) {
        process(item);
    }
    ```

-   **Complex Conditionals:**

    ```typescript
    // Before: Nested ternary
    const result = condition1 ? (condition2 ? value1 : value2) : value3;

    // After: Clear if/else or extracted function
    function determineResult() {
        if (condition1 && condition2) return value1;
        if (condition1) return value2;
        return value3;
    }
    const result = determineResult();
    ```

-   **Dead Code:**
    ```typescript
    // Before: Unused parameter
    function process(data: Data, unusedParam: string) {
        return data.transform();
    }
    // After: Remove unused parameter
    function process(data: Data) {
        return data.transform();
    }
    ```

### Phase 5: Verification

1. **Run comprehensive checks:**

    ```bash
    # Format (should show no changes if formatting was done incrementally)
    nx format

    # Build affected packages
    affected_packages=$(git diff --name-only "$base_branch"...HEAD | \
        grep -E '^packages/[^/]+/' | \
        sed 's|packages/\([^/]*\)/.*|\1|' | \
        sort -u)

    for package in $affected_packages; do
        echo "Building $package..."
        nx build "$package"
        nx build:types "$package"
        nx lint "$package"
    done
    ```

2. **Run tests for affected packages:**

    ```bash
    for package in $affected_packages; do
        echo "Testing $package..."
        nx test "$package"
    done
    ```

3. **Check for any IDE diagnostics:**

    Use `mcp__ide__getDiagnostics` to verify no new errors were introduced.

4. **Validate examples if any were changed:**

    ```bash
    if git diff --name-only "$base_branch"...HEAD | grep -q 'packages/ag-charts-website/src/content/docs'; then
        nx validate-examples ag-charts-website
    fi
    ```

### Phase 6: Create Commit

If all verification passes:

```bash
git add .

# Create commit with detailed message
git commit -m "$(cat <<'EOF'
Distil code quality on ${current_branch}

Reduce code bloat, remove redundancy, and improve clarity:

- Remove N instances of code duplication
- Extract M helper functions for reusability
- Remove P redundant/obvious comments
- Simplify Q complex conditionals
- Remove R unused imports/parameters/methods
- Replace S magic numbers with named constants
- Remove T debug statements

Affected packages:
- ${package-list}

All tests pass, no new lint errors, formatting verified.
EOF
)"
```

### Phase 7: Final Report

```markdown
## ✨ Code Distillation Complete

**Branch:** ${current_branch}
**Base:** ${base_branch}
**Files changed:** N files
**Issues fixed:** M issues

### Summary by Category

| Category        | Issues Found | Issues Fixed | Skipped |
| --------------- | ------------ | ------------ | ------- |
| Critical        | X            | X            | 0       |
| High Priority   | Y            | Y            | Z       |
| Medium Priority | A            | A            | B       |
| Low Priority    | C            | D            | E       |

### Key Improvements

-   Extracted N helper functions to eliminate duplication
-   Removed M lines of redundant comments
-   Simplified P complex conditionals
-   Removed Q unused imports/parameters
-   Replaced R magic values with named constants

### Verification Results

-   ✅ All builds passed
-   ✅ All tests passed
-   ✅ No new lint errors
-   ✅ Formatting verified
-   ✅ No IDE diagnostics errors

### Commit

${commit-hash} - "Distil code quality on ${current_branch}"

---

**Recommendations:**

-   Review the changes to ensure they match your expectations
-   Run additional tests if this affects critical functionality
-   Consider running `nx e2e ag-charts-website` if documentation was affected
```

## 4. Important Guidelines

### What to Keep (Do NOT Remove)

-   **Optimization comments**: These explain performance trade-offs and are valuable
    -   Example: `// Using array instead of Set for better performance with small collections`
-   **WHY comments**: Comments explaining reasoning, not what the code does
    -   Example: `// Process sequentially to avoid race conditions in state updates`
-   **TODOs with JIRA references**: These track actual work items
    -   Example: `// TODO(AG-12345): Refactor to use new API when available`
-   **Complex JSDoc**: Documentation for complex methods with multiple parameters
-   **Performance-critical patterns**: Even if they look "unclear", they may be intentionally optimized
-   **Intentional duplication**: Sometimes duplication is better than the wrong abstraction

### What to Always Remove

-   **Debug statements**: `console.log`, `debugger`, `console.time`, etc.
-   **Dead code**: Commented-out code, unused imports/functions/parameters
-   **Obvious comments**: Restating what the code clearly shows
-   **Redundant JSDoc**: Simple getters/setters don't need documentation
-   **TODOs without context**: Vague TODOs that provide no actionable information
-   **Magic numbers**: Replace with named constants (unless they're obvious like 0, 1, 100)

### When to Ask Before Changing

-   **Large-scale refactoring**: If a function needs to be split into multiple smaller functions
-   **Changing public APIs**: Even internal APIs might be used in ways you don't see
-   **Performance-critical code**: If the code looks intentionally optimized (even if unclear)
-   **Test patterns**: If similar tests use different patterns, there might be a reason
-   **Complex business logic**: If you're not 100% sure the refactoring preserves behavior

### Safety Rules

-   ✅ **Always read full file context** before making changes
-   ✅ **Preserve behavior**: Code should work identically after distillation
-   ✅ **Run verification after each category** of changes
-   ✅ **Commit incrementally** if the user prefers (one commit per category)
-   ❌ **Never guess**: If unsure about removing something, ask the user
-   ❌ **Never remove optimization comments**: These are valuable documentation
-   ❌ **Never sacrifice clarity for brevity**: Shorter is not always better
-   ❌ **Never change logic while "cleaning"**: Distillation should not change behavior

## 5. Common Patterns in AG Charts Codebase

### Acceptable Patterns (Don't "Fix" These)

-   **Manual null checks instead of optional chaining**: Often done for performance in hot paths
-   **Explicit type assertions**: Sometimes necessary for TypeScript limitations
-   **Duplicate code in test files**: Tests should be independent and readable
-   **Long parameter lists**: Sometimes unavoidable in complex APIs
-   **Switch statements instead of polymorphism**: Often clearer for simple cases

### Target Patterns (These Need Attention)

-   **Repeated validation logic**: Should be extracted to validators
-   **Duplicate data transformations**: Should be extracted to helpers
-   **Inline magic numbers**: Should be named constants
-   **Deeply nested conditionals**: Should use early returns
-   **Large functions (>100 lines)**: Should be split by responsibility

## 6. Integration with Existing Workflows

This command complements:

-   **`/pr-review`** - Use `/distil` before requesting PR review to ensure code quality
-   **`/sonar-fix`** - Use `/sonar-fix` for SonarCloud-specific issues, `/distil` for broader quality
-   **`/lint-fix`** - Use `/lint-fix` for automated linting, `/distil` for structural improvements
-   **`/fixup`** - Use `/fixup` for build/lint errors, `/distil` for proactive quality improvements

**Recommended workflow:**

1. Make changes on feature branch
2. Run `/distil` to clean up and productionize
3. Run `/fixup` if there are any build/lint errors
4. Create PR
5. Run `/pr-review` for final review

## 7. Error Recovery

If verification fails after applying fixes:

1. **Review the specific errors**
2. **Attempt to fix within 2-3 iterations**
3. **If unable to fix:**
    ```bash
    # Revert the problematic category
    git reset --hard HEAD~1
    # Or reset to before distillation started
    git reset --hard ${base_commit}
    ```
4. **Report to user:**
    - Which category failed
    - What errors occurred
    - Recommend manual review or smaller batches

## 8. Command Arguments

-   **No arguments**: Analyze and fix all changes on current branch
-   **`help`**: Show usage instructions
-   **`--dry-run`**: Show plan only, don't apply fixes
-   **`--category=<category>`**: Only fix specific category (critical/high/medium/low)
-   **`--files=<pattern>`**: Only analyze files matching pattern

**Examples:**

-   `/distil` - Full distillation of all changes
-   `/distil help` - Show usage instructions
-   `/distil --dry-run` - Show what would be changed without applying
-   `/distil --category=critical` - Only fix critical issues
-   `/distil --files=packages/ag-charts-core/**/*.ts` - Only analyze core package
