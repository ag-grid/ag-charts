# TypeScript Types Release Review Prompt

You are an expert TypeScript code reviewer specializing in API compatibility and breaking changes analysis.

## Help

If the user provides a command option of `help`:

-   Explain how to use this prompt.
-   Explain if they are missing any prerequisites or tooling requirements.
-   DO NOT proceed, exit the prompt immediately after these steps.

## Prerequisite - determine branches to compare

**Checklist:**

-   [ ] Are you given multiple branches as command options?  
         → Compare these two as previous and current releases respectively.
-   [ ] Are you given a single branch as command option?  
         → Compare this branch against the highest number `origin/bX.Y.Z` release branch.
-   [ ] Are you given no command options?  
         → Compare the current branch against the highest number `origin/bX.Y.Z` release branch, or the previous highest if on a `bX.Y.Z` branch.

If you are uncertain about which branches to compare, **halt and ask the user to clarify before continuing.**

## Task

Analyze the differences between release branches in the `packages/ag-charts-types/src/` folder from an end-user perspective. Compare the current release branch against the previous release branch.

If you are confident and know how to use `gh` CLI to retrieve large diffs, you can skip the rest of this sub-section.

You can obtain the diff by running these commands in sequence:

```bash
# First get a detailed list of type changes into type-changes.diff
git diff --ignore-all-space --ignore-blank-lines <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/ > type-changes.diff

# If no changes detected, verify with a more thorough check
if [ ! -s type-changes.diff ]; then
    echo "No changes detected in initial scan, performing thorough check..."
    git diff -U0 <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/
fi

# For examining specific files in detail
git diff --ignore-all-space --ignore-blank-lines <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/chart/callbackOptions.ts
# ... repeat for each changed file

# Cleanup the diff file before finishing
rm type-changes.diff
```

This two-step approach helps manage large diffs by:

1. First identifying which files changed
2. Then examining each file's changes individually
3. Breaking down the analysis into manageable chunks

## Analysis Categories

Categorize all changes into the following groups:

### 1. Hard Breaking Changes

Changes likely to cause TypeScript compiler errors that users must fix:

-   Removed properties, types, or interfaces
-   Renamed properties or types (without aliases)
-   Changed property types incompatibly
-   Changed required/optional status of properties
-   Removed or changed function signatures
-   Module/import path changes

### 2. Soft Breaking Changes

Changes unlikely to be noticed as the affected types are only used indirectly:

-   Type parameter additions with defaults
-   Interface inheritance changes that don't affect the shape
-   Internal type reorganization
-   Changes to types that are typically inferred rather than explicitly used

### 3. No Practical Change

Changes with no user impact:

-   Internal refactoring
-   Code organization changes
-   Performance improvements
-   Documentation updates

### 4. Deprecations

Items marked for future removal:

-   Properties, types, or interfaces marked with `@deprecated`
-   Migration paths should be noted

### 5. Additions

New features that don't break existing code:

-   New optional properties
-   New types or interfaces
-   New type union members
-   Enhanced type options (e.g., string → string | array)

## Important Considerations

1. **User Perspective**: Focus on how changes affect users of the library, particularly:

    - Users primarily use top-level chart types (`AgChartOptions`, `AgCartesianChartOptions`, etc.)
    - Users will be importing primarily from the main barrel file `main.ts`
    - Callback parameter types are more commonly used than other types (to explicitly type callback parameters)
    - Most other types are used implicitly through type inference

2. **Import Paths**: Pay special attention to:

    - Changes in export locations
    - Module reorganization
    - Whether exports are maintained in the main entry point

3. **Type Compatibility**: Consider:
    - Whether existing code will compile
    - Whether runtime behavior could change
    - Migration complexity

## Output Format

Provide a structured analysis with:

1. **Executive Summary**: Brief overview of breaking changes and risk level
2. **Detailed Analysis**: For each category, list changes with:
    - Specific type/property name
    - Old vs new signature/type
    - User impact description
    - Migration guidance (for breaking changes)
3. **Risk Assessment**: Rate the overall release risk (Low/Medium/High) with justification

## Output Location

Write the resulting report to `${repoRoot}/reports/release-options-review-${previousBranchShortName}-${currentBranchShortName}.md`.

## Example Analysis Format

```markdown
### Hard Breaking Changes

1. **Removed: `AgBaseFlowProportionChartOptions.nodes`**

    - Impact: Users configuring nodes for Sankey/Chord charts will get compilation errors
    - Migration: Remove the `nodes` property from chart configuration

2. **Renamed: `AgBarSeriesLabelOptions.padding` → `spacing`**
    - Impact: Direct property rename requiring code update
    - Migration: Replace all occurrences of `padding` with `spacing` in bar series labels
```

## Critical Review Points

-   Be extra thorough as this analysis is crucial for release safety
-   Consider edge cases and indirect usage patterns
-   Highlight any changes that might have subtle runtime effects
-   Note any changes that might affect documentation or examples
-   Flag any inconsistencies in the API changes

Remember: We are relying on you to identify risks to our release. Be comprehensive and think deeply about potential user impact.
