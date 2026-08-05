---
root: false
targets: ['*']
description: 'CartesianSeries consolidated generic types pattern documentation'
globs:
    [
        'packages/ag-charts-community/src/**/series/**/*Series.ts',
        'packages/ag-charts-community/src/**/series/**/*SeriesBase.ts',
        'packages/ag-charts-community/src/**/series/cartesian/cartesianSeriesTypes.ts',
        'packages/ag-charts-enterprise/src/**/series/**/*Series.ts',
        'packages/ag-charts-enterprise/src/**/series/**/*SeriesBase.ts',
    ]
---

# CartesianSeries Consolidated Types Pattern

CartesianSeries takes a single `TTypes extends CartesianSeriesTypes` generic parameter instead of 7 individual parameters. Each series defines a types interface specifying all of them:

```typescript
interface MySeriesTypes extends CartesianSeriesTypes {
    readonly node: MyNode; // Scene graph node type
    readonly options: AgMySeriesOptions; // API options type
    readonly properties: MySeriesProperties;
    readonly datum: MyNodeDatum;
    readonly label: MyLabelDatum; // Often same as datum
    readonly context: MySeriesNodeDataContext;
    readonly stackContext: never; // Or specific type if stacking
}

export class MySeries extends CartesianSeries<MySeriesTypes> {}
```

Individual types are accessed via extractors (`NodeOf<T>`, `DatumOf<T>`, `ContextOf<T>`, …) defined in `cartesianSeriesTypes.ts`.

## Rules

-   **Enterprise series** use the `_ModuleSupport.` prefix for all imported base types (`_ModuleSupport.CartesianSeriesTypes`, `_ModuleSupport.AbstractBarSeries<MySeriesTypes>`, `_ModuleSupport.Rect<MyNodeDatum>`, …).
-   **Bar-like series** extend `AbstractBarSeriesTypes` / `AbstractBarSeries` instead of the cartesian bases.
-   **Template base classes** (e.g. OHLC): the base types interface leaves subclass-varying members open (`node: OhlcBaseNode<any>`), the abstract base takes `TTypes extends OhlcSeriesBaseTypes`, and each concrete series narrows `node`/`options`/`properties`. See `ohlcSeriesBase.ts`.
-   **Context type**: use `CartesianSeriesNodeDataContext<TDatum, TLabel>` (or `AbstractBarSeriesNodeDataContext`) — not `SeriesNodeDataContext`, which lacks the required `scales` and `visible` properties.
-   Existing conversions to copy from: `barSeries.ts` (`AbstractBarSeries`), `lineSeries.ts` / `areaSeries.ts` (`CartesianSeries`), `ohlcSeries.ts` / `candlestickSeries.ts` (template base).

## Key Files

-   `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeriesTypes.ts` — base types and extractors
-   `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts` — CartesianSeries base
-   `packages/ag-charts-community/src/chart/series/cartesian/abstractBarSeries.ts` — AbstractBarSeries base
