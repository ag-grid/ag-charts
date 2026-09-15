---
targets: ['*']
name: module-definitions
description: >-
  Add or change an AG Charts module definition: which options it owns, how community reports it when
  missing, how its theme defaults and validation reach the chart, and how the generated module tables
  stay in step. Use when creating a module, moving a feature into one, adding an option path a module
  owns, or when a "required modules are not registered" report or the module-registration lint is wrong.
---

# Module Definitions and Option Contributions

A `ModuleDefinition` is the single place a feature declares itself. Its `type` decides the lifecycle
(chart, axis, series, plugin, axis:plugin, series:plugin, preset). Its **option contributions** decide
which locations in the options tree it owns. Everything downstream derives from these two facts:

-   first-pass validation defs for module-owned locations (`composeChartOptionsDefs`),
-   the "required modules are not registered" report and the stripping of unowned options,
-   stripping options a chart type does not support (`Option \`x\` is not supported by \`pie\` series`),
-   theme defaults merged from `themeTemplate` at the contributed path,
-   the runtime decision to instantiate an axis or series plugin,
-   the generated placeholder table in community and the ESLint example-validation mappings.

Never add a consumer that special-cases a module by name or option key. If a consumer needs to know
about a location, the owning module must declare it.

## When `contributes` is implied

Most modules own exactly the location their type implies, and declare nothing:

| Type            | Implied location                       | Requested when                     |
| --------------- | -------------------------------------- | ---------------------------------- |
| `plugin`        | `<name>` at the chart root             | non-null and not `{ enabled: false }` |
| `axis:plugin`   | `axes[].<optionsKey ?? name>`          | as above                           |
| `series:plugin` | `series[].<name>`                      | any non-null value (`'present'`)   |

Chart, axis, series and preset modules own whole subtrees by identity and contribute nothing.

## When to declare `contributes`

Declare it when the module owns options anywhere else, or owns several locations:

```ts
export const AxisInteractionModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'axis-interaction',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    contributes: [
        { path: 'axes[].listeners.click', options: callback },
        { path: 'listeners.axisClick', options: callback },
    ],
    create: (ctx) => new AxisInteraction(ctx),
};
```

Each contribution:

-   `path`: dotted, with `[]` marking a segment whose every child is a host (`axes[]`, `series[]`).
    The first segment decides the host: `axes[]` is the axis host, `series[]` the series host, anything
    else the chart host.
-   `options`: validation for the subtree, or one validator for a leaf such as a callback. Omit it to
    keep whatever the chart defs already declare there.
-   `themeTemplate`: defaults merged at the path.
-   `chartTypes` / `axisTypes` / `seriesTypes`: where the location applies. A contribution without
    `chartTypes` inherits the definition's `chartType`.
-   `requested`: `'enabled'` (default) or `'present'`, deciding whether a supplied value counts as a
    request for the missing module.
-   `apiName`: a public name for the report when the path alone reads badly.

`contributes: []` means the module owns no option location at all (internal dependencies, the
community series area).

## Community and enterprise pairs

An enterprise module with the same `name` and `version` as a community one replaces it on
registration (`enterprise: true`). Use this when the community chart needs the module to exist
(`SeriesAreaModule` is a chart-module dependency) and the enterprise variant adds option locations
(`seriesArea.backgroundRegions`). The community variant declares `contributes: []`; the enterprise
variant declares the extra locations. The generated placeholder then names the enterprise variant.

Presets that users reach through an API entry point declare `apiName: 'AgCharts.createGauge'` so the
report names the entry point rather than the registry name.

## Generated tables

`packages/ag-charts-enterprise/src/moduleTables.test.ts` derives from the exported definitions:

-   `packages/ag-charts-community/src/chart/factory/expectedModules.generated.ts`
-   `libraries/ag-charts-eslint-rules/rules/module-mappings.generated.mjs`

and asserts that the documentation module list names only exported module ids. After changing a
definition, a bundle, or a `main.ts` export, regenerate:

```bash
UPDATE_MODULE_TABLES=1 yarn nx test ag-charts-enterprise -- moduleTables
yarn nx format
```

The test fails until the files are regenerated. Do not edit the generated files. A module reachable
only through a bundle is named after the smallest exported bundle that carries it.

`libraries/ag-charts-eslint-rules/rules/module-mappings.mjs` keeps only what definitions do not carry
(default axes per series, intrinsic defaults, the cross-line listener owners) and merges it with the
generated tables.

## Checklist for a new module

1. Write the definition with `type`, `name`, `version`, `create`, and `options`/`themeTemplate`.
2. Declare `contributes` only if the implied location is wrong or incomplete.
3. Export it from the package `main.ts` and add it to the relevant `module-bundles/*.ts`.
4. Regenerate the tables and run `yarn nx test ag-charts-community -- optionsModule` so the
   parametrised contract test covers the new contribution.
5. Add the module to `packages/ag-charts-website/src/content/module-mappings/modules.json` if it is
   user-facing.
