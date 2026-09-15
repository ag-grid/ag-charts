---
root: false
targets: ['*']
description: 'Module definitions own their option locations through `contributes`; consumers derive from it, and the module tables are generated'
globs:
    [
        'packages/ag-charts-*/src/**/*Module.ts',
        'packages/ag-charts-*/src/**/*Modules.ts',
        'packages/ag-charts-*/src/module-bundles/*.ts',
        'packages/ag-charts-community/src/chart/factory/*.ts',
        'packages/ag-charts-core/src/modules/*.ts',
        'libraries/ag-charts-eslint-rules/rules/module-mappings*.mjs',
    ]
---

# Module Definitions — Quick Reference

-   A module's `type` decides its lifecycle; its option contributions decide which option locations it
    owns. Most modules own the one location their type implies and declare nothing. Declare
    `contributes` when the module owns options elsewhere (`axes[].listeners.click`,
    `seriesArea.backgroundRegions`) or several locations; `contributes: []` means none.
-   Never special-case a module name or option key in `processModuleOptions.ts`, `chartTheme.ts`,
    `chart.ts` or the ESLint rule. Add the location to the owning module instead.
-   Do not add feature hooks to `enterpriseRegistry`; a community/enterprise pair shares a `name` and
    the enterprise definition replaces the community one.
-   `expectedModules.generated.ts` and `module-mappings.generated.mjs` are generated. After changing a
    definition, bundle or `main.ts` export run
    `UPDATE_MODULE_TABLES=1 yarn nx test ag-charts-enterprise -- moduleTables`, then `yarn nx format`.

Invoke the `/module-definitions` skill for the contribution fields, the request rule, the pair pattern
and the new-module checklist.
