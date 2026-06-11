---
root: false
targets: ['*']
description: 'number vs bigint (AgNumericValue) conventions: when to widen API types and which utilities to use instead of Math.* and arithmetic operators'
globs: ['packages/ag-charts-types/src/**/*.ts', 'packages/ag-charts-core/src/**/*.ts', 'packages/ag-charts-community/src/**/*.ts', 'packages/ag-charts-enterprise/src/**/*.ts']
---

# Numeric Values: `number` vs `bigint`

AG Charts accepts `bigint` data values for integers beyond `Number.MAX_SAFE_INTEGER` (2^53 − 1). The public alias is `AgNumericValue = number | bigint` (`ag-charts-types/src/chart/dataValues.ts`); time axes use `AgTimeValue = Date | number | bigint | string`.

## When to type an option `AgNumericValue` vs `number`

-   **Data-space values → `AgNumericValue`.** Any option compared against, or interpolated with, the user's data: axis `min`/`max`, cross-line `value`/`range`, size/colour domains, thresholds, annotation coordinates, gauge values, zoom window bounds.
-   **Presentation values → `number`.** Pixels, ratios (0–1), opacities, durations, angles, counts/indices, font sizes. Prefer the semantic aliases (`PixelSize`, `Ratio`, `Opacity`, `DurationMs`) over bare `number`.
-   The test: "could this value legitimately equal a value in the user's data?" If yes, it must admit `bigint`.
-   When widening a type, also switch its option-def validator from `number` to `numericValue` (or `positiveNumberNonZero` to `positiveNumericValueNonZero`; both in `ag-charts-core/src/state/validation.ts`) and make the consuming runtime path bigint-safe (see below), with a value-preserving regression test (same value as `number` and `bigint` must render identically).

## Utilities to use instead of `Math.*` and operators

All from `ag-charts-core` (`utils/data/numbers.ts`, `utils/data/extent.ts`, `utils/types/typeGuards.ts`):

| Instead of                          | Use                                            |
| ----------------------------------- | ---------------------------------------------- |
| `Math.min` / `Math.max`             | `minValue(a, b)` / `maxValue(a, b)`            |
| `Math.abs`                          | `absValue(value)`                              |
| `a + b` / `a - b` on data values    | `addValues(a, b)` / `subtractValues(a, b)`     |
| manual min/max scan over data       | `extent(values)`                               |
| `typeof v === 'number'`             | `isNumericValue(v)`                            |
| `isFiniteNumber(v)` on data values  | `isFiniteNumericValue(v)` (bigint is finite)   |
| `0` literal matched to a data value | `zeroLike(value)`                              |
| `v < 0`                             | `isNegative(value)`                            |

Narrow to `number` only at the render/pixel boundary, using `toNumber(value)` / `toNumberOrUndefined(value)` — never `Number(value)` on untrusted input (it does not warn) and never earlier than necessary (narrowing loses precision above 2^53).

## bigint pitfalls

-   **Mixed arithmetic throws:** `1n + 1` is a `TypeError`. Any `+`/`-`/`*`/`/` on values that may be data must go through the helpers above or narrow first.
-   **Strict equality is type-sensitive:** `5n === 5` is `false`. Datum/value matching against user data must compare via `==` deliberately, or normalise types first.
-   **`typeof` checks silently drop bigints:** `typeof v === 'number'` excludes valid bigint data; use the type guards.
-   **`JSON.stringify` throws on bigint.** Serialise via the memento `encodeTypes`/`decodeTypes` replacers (`ag-charts-core/src/state/memento.ts`) — bigints encode as `{ __type: 'bigint', value: '<digits>' }` strings to preserve precision.
-   **No `Number.prototype` methods:** `toFixed`, `toPrecision` etc. do not exist on bigint; format via the shared number-format utilities or narrow with `toNumber` when pixel-precision output is acceptable.
-   **Precision collapses on narrowing:** distinct bigints can map to the same `Number` (differ below one ULP). Order/compare exact values before narrowing, not after (see `ContinuousScale.domainMin`/`domainMax`).
