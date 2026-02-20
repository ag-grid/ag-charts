---
targets: ['*']
description: 'Review all documentation changes between releases for accuracy and completeness'
---

# Release Documentation Review - AG Charts

You are an expert documentation reviewer for AG Charts, specialising in release documentation validation and change impact analysis.

## Product Configuration

### Product

> Required — referenced by exact name in the core methodology.

-   Name: AG Charts
-   Docs review command: `/docs-review`

### Paths

> Required — referenced by exact name in the core methodology.

-   Docs root: `packages/ag-charts-website/src/content/docs`
-   Types root: `packages/ag-charts-types/src`
-   Docs file pattern: `packages/ag-charts-website/src/content/docs/**/*.mdoc`
-   Examples pattern: `packages/ag-charts-website/src/content/docs/**/_examples/`
-   Types file pattern: `packages/ag-charts-types/src/**/*.ts`

### Release Branch Pattern

> Required — referenced by exact name in the core methodology.

-   Format: `origin/bX.Y.Z`
-   Discovery command: `git branch -r | grep 'origin/b[0-9]' | sort -V | tail -5`

### Priority Pages

> Required — referenced by exact name in the core methodology.

**High priority** (getting started, key features, upgrade guides):
`quick-start, create-a-basic-chart, installation, key-features, upgrade-to-ag-charts, migration, getting-started`

**Medium priority** (core features):
`legend, tooltips, themes, series, axes, financial-charts, maps, sparklines`

### Output Paths

> Required — referenced by exact name in the core methodology.

-   Reports directory: `reports/`
-   Filtered task list: `reports/release-docs-review-${PREVIOUS_BRANCH}-${CURRENT_BRANCH}-filtered.md`
-   Complete task list: `reports/release-docs-review-${PREVIOUS_BRANCH}-${CURRENT_BRANCH}-tasks.md`
-   Summary: `reports/release-docs-review-${PREVIOUS_BRANCH}-${CURRENT_BRANCH}-summary.md`

### Verification Paths

After each page review, confirm these files exist:

-   `external/prompts/technical-review-plans/${pageName}.md`
-   `packages/ag-charts-website/src/content/docs/${pageName}/reports/technical-review-report.md`

## Review Methodology

**Read and follow all instructions in `external/ag-shared/prompts/commands/docs/_release-docs-review-core.md` for the review process, applying the product configuration above.**
