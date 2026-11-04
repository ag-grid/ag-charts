# Breaking Changes Review: b14.2.0 → b14.3.0

**Date:** 2026-11-04  
**Previous:** `origin/b14.2.0` (highest b14.2.x)  
**Current:** `origin/b14.3.0` (highest b14.3.x, Y=3 — final minor before v15)  
**Latest comparison:** `origin/b14.3.0` → `origin/latest` — **0 type changes**

> **Breaking changes are ACCEPTABLE** — Y=3 is the last minor before the next major version.

---

## Summary

| Category | Count |
|---|---|
| Hard Breaking Changes | 5 |
| Soft Breaking Changes | 5 |
| Deprecations | 2 |
| Additions | 15+ |

---

## Hard Breaking Changes

Changes that will cause TypeScript compiler errors for affected users.

### 1. `lineHeight` removed from `AgChartAutoSizedBaseLabelOptions`

**File:** `packages/ag-charts-types/src/chart/labelOptions.ts`

The `lineHeight?: FontSize` property was removed from `AgChartAutoSizedBaseLabelOptions`. This base type is used by:
- `AgLinearGaugeLabelOptions`
- `AgRadialGaugeLabelOptions`
- `AgChartAutoSizedLabelOptions` (and all hierarchy series labels — treemap, sunburst, sankey, etc.)

**Migration:** Remove `lineHeight` from label options. Equivalent layout control may now be achievable through `maxWidth`/`maxHeight` on the extended `AgChartLabelFitOptions` interfaces, or through font sizing options.

### 2–5. Internal `_I*` interfaces removed from `integratedCharts.ts`

**File:** `packages/ag-charts-types/src/integratedCharts.ts`

The following interfaces were removed from the public type surface:
- `IColor` — color utilities interface
- `IChartTheme` — chart theme interface (now replaced by anonymous `{ palette: AgChartThemePalette }`)
- `_IScene` — scene graph constructor types (Path, Group, Scene, Rect, BBox, Arc, Line, Sector, Marker, etc.)
- `_IUtil` — utility types (Color, interpolateColor)

**Also removed:** `IntegratedModule._Scene` and `IntegratedModule._Util` properties.

**Migration:** These were internal implementation types (the `_I` prefix convention indicates private/internal). External code using these types must be updated. As these are exclusively for internal integration between community and enterprise packages, most user code should be unaffected.

### 5b. `_ITheme` interface pruned

Properties removed from `_ITheme`:
- `themeNames`
- `themeSymbols`
- `resolveOperation(operation: Operation): any`
- `themes: Record<string, () => IChartTheme>` (which uses the removed `IChartTheme`)

The `_ITheme.getChartTheme()` now returns `{ palette: AgChartThemePalette }` instead of `IChartTheme`.

---

## Soft Breaking Changes

Changes unlikely to cause compiler errors but could affect runtime behavior or narrow TypeScript inference.

### 1. `AgContextMenuOptions` / `AgContextMenuGetItemsCallback` — added `TParams` generic

`AgContextMenuOptions<TDatum, TContext>` → `AgContextMenuOptions<TDatum, TContext, TParams = unknown>`

The same applies to `AgContextMenuShowOnParams`, `AgContextMenuGetItemsParams`, `AgContextMenuGetItemsCallback`. All new parameters default to `unknown`, so existing two-parameter usage remains valid. Code that explicitly names two type arguments and passes the result to a typed slot expecting three will need updating.

### 2. `AgRangeCrossLineOptions.fill` type widened

`fill?: CssColor` → `fill?: AgCssColorOrRef`

`AgCssColorOrRef` is a superset of `CssColor` (adds theme-colour reference objects). Assigning a `CssColor` value still works; reading the value and assigning to a `CssColor`-typed variable may now need a type assertion.

### 3. `AgAxisLineOptions.stroke` type widened

Same as above: `stroke?: CssColor` → `stroke?: AgCssColorOrRef`.

### 4. `AgCrossLineThemeOptions` restructured

New hierarchy: `AgCrossLineThemeOptions` now extends `AgRangeCrossLineThemeOptions`, which extends `AgLineCrossLineThemeOptions`. Shape is preserved — existing theme configs still apply — but code that references the type explicitly and relies on its `extends` clause will see a different parent type.

### 5. `Operation` union narrowed — `CacheOperation` removed

The `$cacheMax` operation variant was removed from the `Operation` discriminated union. Code that branches on or creates `{ $cacheMax: n }` values typed as `Operation` will error.

---

## Deprecations

### 1. `AgAxisLineOptions.width` deprecated

```ts
/** @deprecated v14.3.0 Use `strokeWidth` instead. */
width?: PixelSize;
```

New `strokeWidth` property added alongside `strokeOpacity` and `lineDash` for a fuller axis-line API.

### 2. Label `alwaysShow` deprecated

Deprecated in favour of `collision.alwaysShow` on linear/radial gauge label options.

---

## Additions (non-breaking)

- **New series: HLC** — `AgHlcSeriesOptions` and related theme options fully exported
- **New preset: Volume Profile** — `AgVolumeProfileChartOptions`, `createVolumeProfileChart` API
- **Context menu:** `AgContextMenuOptions.allowBrowserMenuWithModifierKey` — allow Ctrl/Cmd+right-click to open browser menu
- **Toolbar:** `AgChartToolbarThemeableOptions.buttonSize` — customise toolbar button dimensions
- **Axis line:** New `strokeWidth`, `strokeOpacity`, `lineDash` on `AgAxisLineOptions`
- **Cross line:** New `AgLineCrossLineThemeOptions`, `AgRangeCrossLineThemeOptions`; Cartesian subtypes `AgCartesianLineCrossLineOptions`, `AgCartesianRangeCrossLineOptions`
- **Cross line:** Polar cross-line support — `AgAngleCrossLineOptions`, `AgRadiusCrossLineOptions` now include context param
- **Item type:** `AgItemType` expanded — added `'close'` value
- **Theme params:** Many new params — `buttonActiveBackgroundColor`, `buttonHoverBorder.*`, `buttonActiveBorder.*`, `buttonDisabledBorder.*`, `navigatorHandleBorder.*`, `navigatorTrackBorder.*`, `scrollbarThumb*`, `legendBorder.*`, `seriesLabelBorder.*`, `$lightDark` operation
- **Listeners:** `AgAxesChartListeners` replaces inline listeners on `AgCartesianChartOptions` and `AgPolarChartOptions`
- **Label system:** New `AgChartLabelFitOptions`, `AgChartLabelCollisionFitOptions` interfaces; `truncate` and `collision` on `AgChartAutoSizedBaseLabelOptions`
- **Gauge:** New `AgLinearGaugeTargetLabelOptions`; `placement` now accepts fallback arrays
- **Title:** New `lineHeight` on `AgChartCaptionOptions`; new axis label `lineHeight`
- **Navigator:** HLC mini-chart series support via `AgHlcMiniChartSeriesOptions`
- **Quadrant chart:** `contextMenu` option now available (previously omitted)
- **Validations:** `validations` theme override now accepted in `AgBaseChartThemeOptions`

---

## Latest vs b14.3.0

```
git diff origin/b14.3.0 origin/latest -- packages/ag-charts-types/src/ → 0 lines
```

No type changes on `latest` beyond what is already in `b14.3.0`. No breaking change risk from unreleased work.

---

## Risk Assessment

**Overall: Low-Medium**

The primary practical risk is `lineHeight` removal from auto-sized label types. Users who explicitly set `lineHeight` on gauge or hierarchy chart labels will encounter TypeScript errors when upgrading. The `_I*` interface removals are internal integration types; end-user code is unlikely to reference them directly.

Since this is `b14.3.0` (Y=3 — the final minor before the next major), breaking changes are **acceptable** and consistent with the versioning policy.

**Action required: No** — changes are within acceptable bounds for a final minor release.
