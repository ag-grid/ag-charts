---
targets: ['*']
name: docs-create
description: 'Scaffold a new AG Charts documentation page following established patterns and standards'
invocable: user-only
context: fork
---

# Documentation Page Creation

Scaffolds new AG Charts documentation pages following established patterns and standards.

## Input Requirements

User must provide:

1. **Page Type** (required): `series` | `feature` | `configuration` | `getting-started` | `reference`
2. **Page Name** (required): Kebab-case format (e.g., `waterfall-series`, `gradient-legend`)
3. **Primary API Interface** (required): TypeScript interface name (e.g., `AgWaterfallSeriesOptions`)
4. **Brief Description** (required): One sentence describing what to document
5. **Additional Context** (optional): Related features, variations, enterprise-only indicator

## Sub-Documents

Load the appropriate template based on the page type.

| Document | Purpose | When to Load |
|----------|---------|-------------|
| `template-series.md` | Template and workflow for series pages | Page type is `series` |
| `template-feature.md` | Template and workflow for feature pages | Page type is `feature` |
| `template-configuration.md` | Template and workflow for configuration pages | Page type is `configuration` |
| `examples-and-validation.md` | Example specifications, HTML structure, validation checklist | Always — after generating page content |

## Execution Workflow

### Phase 1: Preparation

1. **Read Documentation Guides**
    - Read `.rulesync/skills/spruce-docs/docs-pages-guide.md` for comprehensive patterns
    - Read `.rulesync/skills/example/ag-charts/examples-guide.md` for example requirements
    - Identify the appropriate template from `.rulesync/skills/spruce-docs/`

2. **Research the API**
    - Read TypeScript definitions in `packages/ag-charts-types/src/`
    - Read implementation files in `packages/ag-charts-{community,enterprise}/src/`
    - Check for theme defaults in `*Module.ts` files

3. **Review Similar Documentation**
    - Find similar existing documentation page(s)
    - Note structure, sections, and patterns used

### Phase 2: Structure Creation

4. **Load appropriate template sub-document** based on page type
5. **Customize template** — replace placeholders, adapt sections, remove/add as needed
6. **Create page structure** — frontmatter, opening paragraph, progressive sections, API Reference

### Phase 3: Content Generation

7. **Generate opening content** — clear, concise, jargon-free
8. **Create example specifications** — load `examples-and-validation.md` for format
9. **Write configuration sections** — simple/default first, then variations, then advanced
10. **Add API Reference** — identify all relevant interfaces, create tabs if multiple

### Phase 4: Validation

11. **Self-check against** `.rulesync/skills/spruce-docs/checklist.md`
12. **Validate structure** — frontmatter, example ordering, code snippets, cross-references

## Output Format

1. **Complete `.mdoc` file** at `packages/ag-charts-website/src/content/docs/[page-name]/index.mdoc`
2. **Example requirements document** — list all required examples with specifications
3. **Navigation entry** — JSON to add to `packages/ag-charts-website/src/content/docs-nav/nav.json`
4. **Validation summary** — checklist results

## Quality Standards

- **Follow established patterns** — use appropriate template, match similar existing pages
- **Be technically accurate** — property names match TypeScript definitions, defaults verified
- **Be framework-agnostic** — use `$framework` placeholder, examples work in all frameworks
- **Be user-friendly** — clear language, examples before explanations, progressive disclosure
- **Be complete** — all required sections present, API reference comprehensive

## Related Resources

- [Documentation Pages Guide](.rulesync/skills/spruce-docs/docs-pages-guide.md)
- [Examples Guide](.rulesync/skills/example/ag-charts/examples-guide.md)
- [Documentation Templates](.rulesync/skills/spruce-docs/)
- [Documentation Checklist](.rulesync/skills/spruce-docs/checklist.md)
- [Documentation Review](/docs-review)
