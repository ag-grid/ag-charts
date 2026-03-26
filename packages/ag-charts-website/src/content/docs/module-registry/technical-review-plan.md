# Technical Review Plan: Module Registry

**Documentation Page**: `packages/ag-charts-website/src/content/docs/module-registry/index.mdoc`
**Review Date**: 2025-12-12
**Review Mode**: Degraded (Static Analysis Only)

## Mode Limitations

-   **Missing MCP Puppeteer**: Cannot perform browser-based testing
-   **Missing Task Tool**: Cannot delegate to example-tester agent
-   **Available**: Static code analysis, configuration verification, API validation

## Files Discovered for Review

### 1. TypeScript Definition Files

**ModuleRegistry API**:

-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-core/src/globals/moduleRegistry.ts` - Core ModuleRegistry implementation
-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-core/src/globals/index.ts` - ModuleRegistry export
-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-core/src/interfaces/moduleDefinition.ts` - Module definition types

**Module Bundle Files**:

-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/module-bundles/all.ts` - AllCommunityModule definition
-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/module-bundles/all.ts` - AllEnterpriseModule definition

**Module Exports**:

-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/main.ts` - Community module exports
-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/main.ts` - Enterprise module exports (to verify)

**Specific Modules Mentioned**:

-   CategoryAxisModule - referenced in docs line 73, 75
-   LineSeriesModule - referenced in docs line 73, 75
-   NumberAxisModule - referenced in docs line 73, 75
-   LegendModule - used in example
-   AnimationModule - referenced in docs line 48, 53, 60, 62
-   HeatmapSeriesModule - referenced in docs line 49, 53, 60, 62

### 2. Implementation Files

**ModuleRegistry Implementation**:

-   `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-core/src/globals/moduleRegistry.ts` - Full implementation with:
    -   `registerModules()` function (line 75-79)
    -   `register()` function (line 33-73)
    -   Version conflict detection (line 52-72)
    -   Idempotent registration behavior (line 48-58)

### 3. Example Files to Validate

**Example: minimal-line-registration**

-   **Location**: `packages/ag-charts-website/src/content/docs/module-registry/_examples/minimal-line-registration/`
-   **Files**:
    -   `main.ts` - Module registration and chart setup
    -   `data.ts` - Sample data for line chart
    -   `index.html` - HTML container

**Documentation Claims**:

-   Demonstrates "minimum set of Community modules required for a cartesian line chart" (line 67)
-   Should register: LineSeriesModule, NumberAxisModule, CategoryAxisModule (line 75)
-   Chart should display with line series showing revenue by quarter

**Configurations to Verify**:

-   ModuleRegistry import from 'ag-charts-community'
-   Registration call before AgCharts.create
-   Line series with type: 'line'
-   Category axis on x-axis
-   Number axis on y-axis
-   Data structure matches series configuration

### 4. Interactive Features (Cannot Test - Browser Required)

The following features are described in documentation but cannot be verified without browser:

-   Module selector tool at line 97-99 (`{% moduleMappings /%}`)
-   Generated registration snippet copying
-   Dev URL testing at `https://localhost:4600/charts/javascript/module-registry/`
-   Actual chart rendering and module registration behavior

### 5. Visual States (Cannot Capture - Puppeteer Required)

-   Chart rendering after minimal module registration
-   Chart title display
-   Line series visualization
-   Axis labels and titles
-   Legend display

## Validation Tasks

### Technical Accuracy Validation

1. **ModuleRegistry API Verification**:

    - Verify `ModuleRegistry.registerModules()` signature matches documentation
    - Verify it accepts array of modules (line 75-79 in moduleRegistry.ts)
    - Verify idempotent behavior claim (line 79 in docs)
    - Verify version conflict error handling exists

2. **Bundle Definitions**:

    - Verify AllCommunityModule contains all Community modules
    - Verify AllEnterpriseModule contains all Community + Enterprise modules
    - Confirm bundle export locations match documentation

3. **Import Path Validation**:

    - Verify ModuleRegistry can be imported from 'ag-charts-community' (line 38)
    - Verify ModuleRegistry can be imported from 'ag-charts-enterprise' (line 33)
    - Verify individual modules can be imported from both packages (line 43-62)

4. **Module Naming**:
    - Verify CategoryAxisModule, LineSeriesModule, NumberAxisModule exist
    - Verify AnimationModule, HeatmapSeriesModule exist
    - Check for any deprecated or renamed modules

### Example Consistency Validation (Static Analysis)

**minimal-line-registration example**:

1. Verify module registration occurs before `AgCharts.create()` call
2. Verify all required modules are registered (LineSeriesModule, NumberAxisModule, CategoryAxisModule)
3. Check if LegendModule is necessary (example includes it but docs don't mention it at line 75)
4. Verify series configuration matches registered modules
5. Verify data structure is compatible with series configuration
6. Confirm example follows best practices for module registration

### Content Quality Review

1. **Completeness**:

    - Check if all major module types are mentioned (series, axes, features)
    - Verify bundle documentation is complete
    - Check if error scenarios are documented (version conflicts)

2. **Clarity**:

    - Verify registration order is clear (before AgCharts.create)
    - Check if bundle vs individual module tradeoffs are explained
    - Verify import path guidance is clear for Community vs Enterprise users

3. **Accuracy**:
    - Cross-reference all code snippets with actual implementation
    - Verify claims about bundle contents
    - Check default behavior for UMD users (line 10-11)

## Known Issues to Investigate

1. **Example vs Documentation Mismatch**:

    - Documentation at line 75 lists: `LineSeriesModule, NumberAxisModule, CategoryAxisModule`
    - Example at line 13 registers: `CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule`
    - Need to verify if LegendModule is actually required or optional

2. **Registration Order**:

    - Documentation doesn't specify if module registration order matters
    - Implementation should be checked for dependency handling

3. **UMD Bundle Claim**:
    - Line 10-11 claims UMD bundle doesn't need module registration
    - Need to verify this is accurate

## Exceptions File

No exceptions file found at:
`packages/ag-charts-website/src/content/docs/module-registry/technical-review-exceptions.md`

## Next Steps

Proceed to Phase 2: Execute Review with static analysis limitations noted.
