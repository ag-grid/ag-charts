# Breaking Changes Review: b14.1.0 → b14.2.0 | b14.2.0 → latest

**Date:** 2026-09-30
**Current release branch:** `b14.2.0` (minor Y=2)
**Previous release branch:** `b14.1.0`
**Breaking changes acceptable:** NO — Y < 3

---

## COMPARISON 1: b14.1.0 → b14.2.0

### Hard Breaking Changes — 3 found

#### 1. `ExtensibleTheme` renamed/replaced (CRITICAL — HIGH IMPACT)
- **File:** `packages/ag-charts-types/src/chart/themeMap.ts`
- **Change:** `ExtensibleTheme<SType, TDatum, TContext>` was renamed to `ExtensibleSeriesTheme<SType, TDatum, TContext>`. A new, incompatible `ExtensibleTheme<TDatum, TContext>` (no `SType` parameter) was introduced to replace the original export name.
- **Effect:** Any user code referencing `ExtensibleTheme<'line', MyDatum>` or `ExtensibleTheme<'bar'>` will fail with a TypeScript compiler error because the first parameter is now `TDatum`, not a series type.
- **Severity:** HIGH — this is a named public export used by enterprise users extending chart themes per-series-type.
- **Migration:** Replace every `ExtensibleTheme<SType, ...>` with `ExtensibleSeriesTheme<SType, ...>`.
- **Recommended fix:** Add a backwards-compat re-export alias:
  ```ts
  export type ExtensibleTheme<SType extends SeriesType, TDatum = DatumDefault, TContext = ContextDefault> =
      ExtensibleSeriesTheme<SType, TDatum, TContext>;
  ```

#### 2. `AgPreventableEvent` — new required `defaultPrevented: boolean`
- **File:** `packages/ag-charts-types/src/chart/eventOptions.ts`
- **Change:** `readonly defaultPrevented: boolean` added as a non-optional member.
- **Effect:** Object literals and test stubs typed as `AgPreventableEvent` (or its subinterfaces: `AgChartLegendClickEvent`, `AgChartLegendDoubleClickEvent`, `AgNodeClickEvent`) must now include `defaultPrevented`. Handler code that only reads the event object is unaffected.
- **Severity:** LOW-MEDIUM — only affects users constructing typed mock/stub objects in test code.
- **Migration:** Add `defaultPrevented: boolean` to any stub typed as these interfaces.

#### 3. Legend click events — new required `visible: boolean`
- **File:** `packages/ag-charts-types/src/chart/legendOptions.ts`
- **Change:** `AgChartLegendClickEvent.visible` and `AgChartLegendDoubleClickEvent.visible` added as `boolean` (non-optional).
- **Effect:** Same pattern as #2. Test/adapter code constructing mock legend click events must add the field.
- **Severity:** LOW — only affects users constructing typed mock objects.
- **Migration:** Add `visible: boolean` to any mock typed as these interfaces.

---

### Soft Breaking Changes — 5 found

1. **`AgAxisValue` union expanded** (`axisOptions.ts`): `AgGroupedCategoryValue = (string | null)[]` added to union. Code with exhaustive narrowing (e.g., `if typeof v === 'string' ... else /* assumed number|Date|bigint */`) may now hit an unhandled branch at runtime.

2. **`AgAxisDomain` union expanded** (`axisOptions.ts`): `AgGroupedCategoryValue[]` added. Same pattern as above.

3. **`TextAlign` union expanded** (`types.ts`): `'start' | 'end'` added to `'left' | 'center' | 'right'`. Exhaustive switch/if statements over this type need an extra case.

4. **`AgCartesianCrossLineOptions` new generic type parameter** (`cartesianOptions.ts`): Second parameter `TContext = ContextDefault` added. Backward-compatible due to default, but inferred types in callbacks may change if the context type propagates.

5. **`AgNodeClickEvent` structural refactor** (`eventOptions.ts`): Fields reorganised onto `AgNodeClickParams` and inherited via `AgBaseNodeClickEvent`. All same fields remain accessible on the event object; handler code is unaffected. TypeScript code that uses conditional/mapped types referencing the interface directly should recheck.

---

### Deprecations — 3 found

1. **`AgConeFunnelSeriesLabelPlacementAlias`** (`collisionAvoidanceOptions.ts`): `type 'before' | 'middle' | 'after'` — use the `*-center` values of `AgConeFunnelSeriesLabelPlacement` instead.

2. **`AgHeatmapSeriesThemeableOptions.textAlign`** (`heatmapOptions.ts`): `@deprecated v14.2.0` — use `label.textAlign` instead.

3. **`AgHeatmapSeriesThemeableOptions.verticalAlign`** (`heatmapOptions.ts`): `@deprecated v14.2.0` — use `label.verticalAlign` instead.

---

### Additions — ~60 items

Key new optional features (none required on existing types, backward-compatible):

- `AgChartParams`, `AgChartModuleDefinition`, `AgChartModule` — new per-instance module registration API
- `AgChartsApi.createQuadrantChart()` and full `AgQuadrantChartOptions` type tree
- `AgTypedChartInstance.isModuleRegistered()`
- `AgAxisCoordinate` interface; `AgAxisLabelFormatterParams.depth`; label `textAlign`/`verticalAlign`
- `AgCartesianAxisCrossAt.titlePlacement`, `labelPlacement`, `crosshairLabelPlacement`; `AgCartesianAxisCrossAtPlacement` type
- `AgCartesianSeriesAreaOptions`, `AgSeriesAreaBackgroundRegion` — background region fills
- `AgCrossLineListeners`, `AgAxisListeners` with click/doubleClick events
- `AgCaptionListeners`, `AgCaptionClickEvent`
- `AgChartHighlightMode`; `AgChartHighlightOptions.mode`
- `AgChartValidationsOptions`, `AgChartValidationIssueEvent`, `AgChartValidationSeverity`; `AgBaseChartOptions.validations`
- New legend disabled-item styling interfaces
- `AgMatchedParams`, `AgNodeClickParams`, `AgCrossLineClickParams`
- New funnel/pyramid label placement types
- `AgAnnotationAxisLabel.padding`; `AgChartCaptionOptions.minimumFontSize`, `listeners`
- `AgWaterfallSeriesThemeableOptions.label` (top-level shared label)
- New series-specific label options interfaces

---

## COMPARISON 2: b14.2.0 → latest (unreleased)

### Hard Breaking Changes — 0 found

No confirmed hard breaking changes between b14.2.0 and `origin/latest`.

---

### Soft Breaking Changes — 2 found

1. **`AgContextMenuShowOnParams*` interfaces gain required `event: Event`** (`contextMenuOptions.ts`): A new `ShowOnParamsMixin` is intersected into every `AgContextMenuShowOnParams*` type, adding `event: Event`. Handler code that receives these objects is unaffected (purely additive). Test/stub code that constructs typed objects of these interfaces must now include `event`.

2. **Cross-line types refactored to named interface unions** (`cartesianOptions.ts`, `polarAxisOptions.ts`, `radiusAxisOptions.ts`): `AgCartesianCrossLineOptions`, `AgAngleCrossLineOptions`, `AgRadiusCrossLineOptions` changed from type aliases over `AgBaseCrossLineOptions` to unions of new named interfaces. Structural compatibility is preserved; only code using declaration merging or `typeof` in mapped types against the old aliases is affected.

---

### Deprecations — 2 found

1. **`AgAxisLineOptions.width`** (`axisOptions.ts`): `@deprecated v14.2.0` — use `strokeWidth` instead. The property remains; existing code compiles with a deprecation warning.

2. **`AgMapShapeSeriesLabelOptions.overflowStrategy`** (`mapShapeOptions.ts`): `@deprecated v14.2.0` — use `truncate` instead.

---

### Additions

- `AgAxisLineOptions.strokeWidth`, `strokeOpacity`, `lineDash` (new preferred API)
- `AgAxisLineOptions.stroke` widened from `CssColor` to `AgCssColorOrRef` (non-breaking widening)
- `AgAxisCrossLineListeners` interface; polar axis `listeners` on angle/radius axis options
- Named cross-line interface variants: `AgCartesianLineCrossLineOptions`, `AgCartesianRangeCrossLineOptions`, etc.
- `AgRangeCrossLineOptions.fill` and `AgCrossLineThemeOptions.fill` widened to `AgCssColorOrRef`
- `AgVolumeProfileOptions` for financial charts (note: all fields have `/** TODO */` JSDoc — appears unfinished)
- `ShowOnParamsMixin.event: Event` on all context-menu ShowOn param types
- Many formatting-only union type reformats (zero semantic change)

---

## Risk Summary

| Comparison | Hard Breaks | Soft Breaks | Deprecations | Additions |
|---|---|---|---|---|
| b14.1.0 → b14.2.0 | 3 | 5 | 3 | ~60 |
| b14.2.0 → latest | 0 | 2 | 2 | ~15 |

**Overall risk: HIGH for b14.2.0 release**

The `ExtensibleTheme` rename is a clear, hard, non-mitigatable breaking change for users who extend AG Charts themes using the `ExtensibleTheme` type. This must be addressed before b14.2.0 ships:

- **Option A (preferred):** Add a backwards-compat `ExtensibleTheme` alias pointing to `ExtensibleSeriesTheme`.
- **Option B:** Revert the rename and choose a different name for the new type.

The `defaultPrevented` and `visible` additions to event interfaces are technically breaking but have low real-world impact (only affects users with typed mock objects in test suites). A changelog notice should be sufficient.

The `latest` branch is clean — no hard breaks to address before promotion to a future minor.
