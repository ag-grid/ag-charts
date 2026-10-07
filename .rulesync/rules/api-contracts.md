---
root: false
targets: ['*']
description: 'Public API contract boundaries and the undocumented-options validator pattern'
globs: ['packages/ag-charts-types/**/*.ts', 'packages/ag-charts-*/src/config/**/*.ts', 'packages/ag-charts-*/src/**/*OptionsDef*.ts', 'packages/ag-charts-core/src/options/*.ts']
---

# API Contracts and Undocumented Options

This guide covers the distinction between public API contracts and internal/undocumented options.

## Public API Contract: ag-charts-types

The `ag-charts-types` package is the **public/documented interface contract**. All types defined there are considered part of the public API and subject to semantic versioning guarantees.

**Key constraint:** Do NOT add undocumented or internal options to `ag-charts-types`. This package should only contain options that are:

-   Documented in the public docs
-   Supported for external use
-   Covered by breaking change policies

## Undocumented Options Pattern

For an internal option whose key is absent from the options type, spread `undocumentedDefs` (from `ag-charts-core`) inside the defs literal that owns it:

```typescript
export const commonChartOptionsDefs: OptionsDefs<...> = {
    enableRtl: boolean,
    ...undocumentedDefs({
        myUndocumentedOption: boolean,
        myNestedOption: { visible: boolean },
    }),
};
```

This pattern:

-   Accepts the option at runtime with validation, while keeping it out of the public API contract
-   Type-checks without `@ts-expect-error`: the helper returns an empty type, so the literal still matches `OptionsDefs<T>`
-   Marks each key as undocumented, so validation leaves it out of "did you mean" suggestions

When the key already exists on the type (for example an internal field of a defs object typed as a plain record), wrap only its validator inline: `maxWidth: undocumented(positiveNumber)`.

**Never assign keys onto a defs object after its declaration** (`defs.key = undocumented(…)`, `Object.assign(defs.label, …)`). A top-level mutation is a side effect, so bundlers keep the whole defs object and everything it references in every application bundle, even when the owning module is not used. If the key belongs to a shared nested literal, add it inside that literal or extract the literal into its own `const` and spread into it there.

### Existing Examples

Examples from `packages/ag-charts-core/src/options/chartDefaults.ts` (for the full set, run `grep -n -A4 "undocumentedDefs(" packages/ag-charts-core/src/options/chartDefaults.ts`).

Chart-level:

-   `statusBar`
-   `foreground`
-   `overrideDevicePixelRatio`
-   `displayNullData`
-   `dataSource.requestThrottle`, `dataSource.updateThrottle`, `dataSource.updateDuringInteraction`
-   `ranges.minSize`

Series-level:

-   `allowNullKeys` - allows null/undefined as discrete category keys
-   `seriesGrouping`

## Documented Options on Chart

When adding a **documented** chart-level option (one that exists in `ag-charts-types`), read it where it is used from the resolved options in chart state:

```typescript
const dataIdKey = this.ctx.chartState.getValue('options', 'dataIdKey');
```

Read it once into a local per scope, as each `getValue` call has a cost. Do **not** access `processedOptions` directly (e.g., `(this.chartOptions.processedOptions as any).foo`), and do not mirror the option onto a field or getter on `Chart`; chart state is the single reactive source.

**Checklist for a new documented chart-level option:**

1. Add type to `ag-charts-types` (e.g., `AgBaseChartOptions`)
2. Add validator to all chart option defs in `chartOptionsDefs.ts`
3. Read it through `ctx.chartState.getValue('options', …)`; if `ResolvedChartOptions` (`ag-charts-core/src/options/normalised/normalisedChartOptions.ts`) omits it, extend that type rather than casting
4. If the option affects the DataSet or other persistent state, ensure state is recreated when the option changes (not just when `data` changes)
5. If the option includes a callback/renderer, use `TContext = ContextDefault` for the `context` parameter — never `any`. Thread `TContext` from the root chart options through all intermediate interfaces so user-supplied generics propagate to the renderer params.

**Lint constraint**: The `aglint/require-explicit-generic` rule requires explicit type arguments on all generic type references in `ag-charts-types`. When making a previously non-generic interface generic, grep for all references and add explicit type args. Prefer `unknown` over `any` for type aliases that don't propagate a specific context.

## Propagating Undocumented Options

To propagate a root-level undocumented option to series, use the `processSeriesOptions()` method in `optionsModule.ts`. This is the preferred centralised approach that affects all series types.

**Steps:**

1. Add the validator to the `undocumentedDefs` block in `commonChartOptionsDefs` (`chartDefaults.ts`)
2. Modify `processSeriesOptions()` in `optionsModule.ts` to propagate the value
3. Use `(options as any).optionName` to access without TypeScript errors

**Why this approach over theme template expressions:**

-   Single location to change, affects all series types
-   Straightforward conditional logic for precedence handling
-   No need to modify individual series module theme templates
