---
root: false
targets: ['*']
description: 'Three-tier default system quick reference — loads /chart-defaults for the full lookup procedure'
globs:
    [
        'packages/ag-charts-*/src/**/*Module.ts',
        'packages/ag-charts-*/src/**/*Properties.ts',
        'packages/ag-charts-*/src/**/*Options.ts',
    ]
---

# Default Values — Quick Reference

Defaults are layered; each layer overrides the one below:

```
User configuration
        ↓
Theme template in *Module.ts   ⭐ the ACTUAL runtime default users see
        ↓
@Property decorator in *Properties.ts   (fallback only, rarely what users experience)
```

-   **Never document or test against a `@Property` initialiser** without first checking the series/feature `*Module.ts` `themeTemplate` — the theme value almost always overrides it. Document what users actually see, not the internal fallback.
-   **JSDoc `Default:` must be its own paragraph**, separated from the description by a blank `*` line. Inline (`/** Spacing. Default: \`20\` */`) renders as body text instead of a labelled default in the API reference. This applies to every option in `ag-charts-types`, however short the description.
-   A `Default:` comment that disagrees with the theme template is **stale** — fix the comment, not the template.

For the full lookup procedure — locating the module file, the four-step verification, and the module-path table covering series, axes, legend, annotations and global themes — invoke the `/chart-defaults` skill.

## Key Files

| Layer            | Pattern                                                           |
| ---------------- | ----------------------------------------------------------------- |
| Theme templates  | `packages/ag-charts-{community,enterprise}/src/**/*Module.ts`      |
| Property classes | `packages/ag-charts-{community,enterprise}/src/**/*Properties.ts`  |
| Global themes    | `packages/ag-charts-community/src/chart/themes/`                   |
