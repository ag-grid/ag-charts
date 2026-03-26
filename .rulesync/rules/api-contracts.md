---
paths: 'packages/ag-charts-types/**/*.ts, packages/ag-charts-*/src/config/**/*.ts'
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

For internal/undocumented options, use the validator pattern in `chartDefaults.ts`:

```typescript
// @ts-expect-error undocumented option
commonChartOptionsDefs.myUndocumentedOption = undocumented(boolean);
```

This pattern:

-   Allows the option to be accepted without TypeScript type errors
-   Keeps the option out of the public API contract
-   Provides runtime validation

### Existing Examples

Undocumented chart-level options in `chartDefaults.ts`:

-   `flashOnUpdate`
-   `statusBar`
-   `foreground`
-   `overrideDevicePixelRatio`
-   `sync.domainMode`
-   `displayNullData`

Undocumented series-level options:

-   `allowNullKeys` - allows null/undefined as discrete category keys

## Documented Options on Chart

When adding a **documented** chart-level option (one that exists in `ag-charts-types`), expose it as a `@Property` decorated field on the `Chart` class:

```typescript
@Property
dataIdKey: string | undefined = undefined;
```

This is automatically synced from `processedOptions` via `jsonApply()` in `applyOptions()`. Do **not** access `processedOptions` directly (e.g., `(this.chartOptions.processedOptions as any).foo`) — that bypasses the decorator infrastructure and is not reactive to option changes.

**Checklist for a new documented chart-level option:**

1. Add type to `ag-charts-types` (e.g., `AgBaseChartOptions`)
2. Add validator to all chart option defs in `chartOptionsDefs.ts`
3. Add `@Property` field on `Chart` class — `jsonApply` handles the rest
4. If the option affects the DataSet or other persistent state, ensure state is recreated when the option changes (not just when `data` changes)

## Propagating Undocumented Options

To propagate a root-level undocumented option to series, use the `processSeriesOptions()` method in `optionsModule.ts`. This is the preferred centralised approach that affects all series types.

**Steps:**

1. Add the validator to `commonChartOptionsDefs` in `chartDefaults.ts`
2. Modify `processSeriesOptions()` in `optionsModule.ts` to propagate the value
3. Use `(options as any).optionName` to access without TypeScript errors

**Why this approach over theme template expressions:**

-   Single location to change, affects all series types
-   Straightforward conditional logic for precedence handling
-   No need to modify individual series module theme templates
