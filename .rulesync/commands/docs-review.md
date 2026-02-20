---
targets: ['*']
description: 'Review documentation pages for technical accuracy and example consistency'
---

# Documentation Review - AG Charts

You are a technical documentation reviewer for AG Charts. Review documentation pages for technical accuracy and example consistency using the shared three-phase approach.

**Note**: This command validates existing documentation. For creating new documentation pages, use the `/docs-create` command and follow the [Documentation Pages Guide](../../.rulesync/rules/docs-pages.md).

## Product Configuration

### Input Requirements

> Required — referenced by exact name in the core methodology.

User provides:

-   Documentation page path: `packages/ag-charts-website/src/content/docs/${pageName}/index.mdoc`
-   Live dev URL: `https://localhost:4600/charts/javascript/${pageName}/`

### Orchestration Indicator

-   Orchestrator script: `external/prompts/run-docs-review.js`

### File Resolution Rules

> Required — referenced by exact name in the core methodology.

For each API/interface mentioned in docs, resolve TypeScript definition files sequentially:

| If docs mention                            | Then check file                                                     |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Property path like `series[].type: 'bar'`  | `packages/ag-charts-types/src/series/cartesian/barSeriesOptions.ts` |
| Property path like `axes[].type: 'number'` | `packages/ag-charts-types/src/axes/axis/axisOptions.ts`             |
| Interface name like `AgPieSeriesOptions`   | Search `packages/ag-charts-types/src/**/*` for the interface        |
| Generic config property                    | `packages/ag-charts-types/src/chart/agChartOptions.ts`              |
| Theme property                             | `packages/ag-charts-types/src/chart/themes/chartTheme.ts`           |

### Implementation Resolution Rules

> Required — referenced by exact name in the core methodology.

Map features to source implementation files:

| Feature Category                             | Implementation Path Pattern                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| Series type: `${type}` (e.g., "bar", "line") | `packages/ag-charts-{community,enterprise}/src/series/cartesian/${type}/*Series.ts` |
| Series type: pie/donut                       | `packages/ag-charts-community/src/series/polar/pie/*Series.ts`                      |
| Series/feature module with theme defaults    | `packages/ag-charts-{community,enterprise}/src/**/*Module.ts`                       |
| Axis feature                                 | `packages/ag-charts-community/src/axes/**/*.ts`                                     |
| Legend feature                               | `packages/ag-charts-community/src/chart/legend/*.ts`                                |
| Annotation feature                           | `packages/ag-charts-enterprise/src/features/annotations/**/*.ts`                    |
| General chart feature                        | Search `packages/ag-charts-{community,enterprise}/src/` using Grep                  |

### Example Path Pattern

> Required — referenced by exact name in the core methodology.

`packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/`

-   Required: `main.ts`
-   Optional: `data.ts`, `styles.css`

### Example Direct URL Pattern

> Optional — referenced by exact name in the core methodology.

`https://localhost:4600/vanilla/${pageName}/examples/${exampleName}/example-runner`

The `vanilla` framework variant is used as it loads slightly faster than `typescript`.

### Exceptions File Path

`packages/ag-charts-website/src/content/docs/${pageName}/technical-review-exceptions.md`

### Output Paths

> Required — referenced by exact name in the core methodology.

-   Review plans: `external/prompts/technical-review-plans/${pageName}.md`
-   Reports: `packages/ag-charts-website/src/content/docs/${pageName}/reports/technical-review-report.md`
-   Summary: `reports/docs-review/summary.md`

### Default Value Verification Hierarchy

> Required — referenced by exact name in the core methodology.

When checking defaults, always verify against this three-tier hierarchy:

1. **First**: Check `*Module.ts` theme template (actual runtime default)
2. **Fallback**: Check `@Property` decorator (only if not in theme)
3. **Verify**: TypeScript comments match the actual runtime default

Theme templates in `*Module.ts` files override decorator defaults and represent actual runtime behaviour. See [Default Values Guide](../../.rulesync/rules/defaults.md) for complete details.

### Product-Specific Conventions

-   **Object Configuration Enablement**: `label: { fontWeight: 'bold' }` implies `enabled: true`
    -   Applies to: label, marker, tooltip, legend, axes
    -   Exception: theme.overrides requires explicit `enabled`
-   **Common Pitfalls**:
    -   Verify default values against theme templates first, not just `@Property` decorators
    -   Don't assume similar chart types (pie/donut) behave identically
    -   Check module files (`*Module.ts`) for actual runtime defaults before documenting
-   **Known Accepted Patterns** (do NOT flag these as issues):
    -   `document.getElementById('...').innerHTML = String(value)` for updating slider/control value displays in examples is an established codebase convention used across legend, bars, scatter, bubble, gauge, and scrollbar examples
-   **Interface Naming Convention**: AG Charts interfaces follow the `Ag*` prefix pattern (e.g., `AgPieSeriesOptions`, `AgChartTheme`). When scanning docs for interface references, match `Ag*Options`, `Ag*Theme`, `Ag*Style`, and similar patterns.

### Browser Testing Tips

-   File: `.rulesync/rules/docs-review-testing.md`

### Phase 3 Notes

AG Charts has ~110 documentation pages. When executing Phase 3 batch processing, use batches of ~10 pages each.

## Review Methodology

**Read and follow all instructions in `external/ag-shared/prompts/commands/docs/_docs-review-core.md` for the review process, applying the product configuration above.**
