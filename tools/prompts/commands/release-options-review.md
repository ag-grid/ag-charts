# TypeScript Types Release Review Prompt

You are an expert TypeScript code reviewer specializing in API compatibility and breaking changes analysis.

## Perquisite - determine branches to compare

Determine the branches to compare:

-   If given multiple branches as command options, compare these two as previous and current releases respectively.
-   If given a single branch as command option, compare this branch against the highest number `bX.Y.Z` release branch.
-   If given no command options, compare the current branch against the highest number `bX.Y.Z` release branch, or the previous highest if on a `bX.Y.Z` branch.

Halt and ask the user to clarify if uncertain before continuing.

## Task

Analyze the differences between release branches in the `packages/ag-charts-types/src/` folder from an end-user perspective. Compare the current release branch against the previous release branch.

You can obtain the diff by running these commands in sequence:

```bash
# First get an overview of changed files
git diff --ignore-all-space --ignore-blank-lines <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/ --stat

# Then examine each changed file in detail
git diff --ignore-all-space --ignore-blank-lines <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/chart/callbackOptions.ts
git diff --ignore-all-space --ignore-blank-lines <$previousBranch> <$currentBranch:-HEAD> -- packages/ag-charts-types/src/chart/axisOptions.ts
# ... repeat for each changed file
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
