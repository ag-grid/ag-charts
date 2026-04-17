---
root: false
targets: ['*']
description: 'CartesianSeries consolidated generic types pattern documentation'
globs: ['**/series/cartesian/**/*.ts', '**/series/**/*Series.ts']
---

# CartesianSeries Consolidated Types Pattern

This guide documents the consolidated generic types pattern for CartesianSeries and its subclasses.

## Overview

CartesianSeries uses a single `TTypes` parameter instead of 7 individual generic parameters. This reduces cognitive load and enables future refactoring.

**Before** (7 parameters):

```typescript
class CartesianSeries<TNode, TOpts, TProps, TDatum, TLabel, TContext, TStackContext>
```

**After** (1 parameter):

```typescript
class CartesianSeries<TTypes extends CartesianSeriesTypes>
```

## The Types Interface

Each series defines a types interface that specifies all type parameters:

```typescript
interface CartesianSeriesTypes {
    readonly node: Node<any>; // Scene graph node type
    readonly options: object; // API options type
    readonly properties: CartesianSeriesProperties<this['options']>;
    readonly datum: CartesianSeriesNodeDatum; // Node datum type
    readonly label: SeriesNodeDatum<number>; // Label datum type
    readonly context: CartesianSeriesNodeDataContext<this['datum'], this['label']>;
    readonly stackContext: any; // Stack context (or never)
}
```

## Type Extractors

Access individual types from TTypes using extractors:

```typescript
type NodeOf<T extends CartesianSeriesTypes> = T['node'];
type DatumOf<T extends CartesianSeriesTypes> = T['datum'];
type ContextOf<T extends CartesianSeriesTypes> = T['context'];
// etc.
```

## Implementing for a New Series

### 1. Define Types Interface

```typescript
// At top of series file
interface MySeriesTypes extends CartesianSeriesTypes {
    readonly node: MyNode;
    readonly options: AgMySeriesOptions;
    readonly properties: MySeriesProperties;
    readonly datum: MyNodeDatum;
    readonly label: MyLabelDatum; // Often same as datum
    readonly context: MySeriesNodeDataContext;
    readonly stackContext: never; // Or specific type if stacking
}
```

### 2. Extend Base Class

```typescript
export class MySeries extends CartesianSeries<MySeriesTypes> {
    // ...
}
```

### 3. For Enterprise Series

Use `_ModuleSupport.` prefix:

```typescript
interface MySeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: _ModuleSupport.Rect<MyNodeDatum>;
    readonly options: AgMySeriesOptions;
    readonly properties: MySeriesProperties;
    readonly datum: MyNodeDatum;
    readonly label: MyNodeDatum;
    readonly context: _ModuleSupport.CartesianSeriesNodeDataContext<MyNodeDatum, MyNodeDatum>;
    readonly stackContext: never;
}

export class MySeries extends _ModuleSupport.CartesianSeries<MySeriesTypes> {
    // ...
}
```

## Common Patterns

### Via AbstractBarSeries

For bar-like series:

```typescript
interface MyBarSeriesTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: _ModuleSupport.Rect<MyBarNodeDatum>;
    readonly options: AgMyBarSeriesOptions;
    readonly properties: MyBarSeriesProperties;
    readonly datum: MyBarNodeDatum;
    readonly label: MyBarNodeDatum;
    readonly context: MyBarSeriesNodeDataContext;
    readonly stackContext: never;
}

export class MyBarSeries extends _ModuleSupport.AbstractBarSeries<MyBarSeriesTypes> {
    // ...
}
```

### Template Base Classes

For series with a common base (like OHLC):

```typescript
// Base types - leave some types open
export interface OhlcSeriesBaseTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: OhlcBaseNode<any>; // Open for subclasses
    readonly options: AgOhlcSeriesBaseOptions;
    readonly properties: OhlcSeriesBaseProperties<this['options']>;
    readonly datum: OhlcNodeDatum;
    readonly label: OhlcNodeDatum;
    readonly context: OhlcSeriesBaseNodeDataContext;
}

// Base class
export abstract class OhlcSeriesBase<
    TTypes extends OhlcSeriesBaseTypes,
> extends _ModuleSupport.AbstractBarSeries<TTypes> {}

// Concrete types - specify the node
interface OhlcSeriesTypes extends OhlcSeriesBaseTypes {
    readonly node: OhlcNode;
    readonly options: AgOhlcSeriesOptions;
    readonly properties: OhlcSeriesProperties;
}

export class OhlcSeries extends OhlcSeriesBase<OhlcSeriesTypes> {}
```

## Context Type Selection

Use the appropriate context type:

| Series Type       | Context Type                                       |
| ----------------- | -------------------------------------------------- |
| CartesianSeries   | `CartesianSeriesNodeDataContext<TDatum, TLabel>`   |
| AbstractBarSeries | `AbstractBarSeriesNodeDataContext<TDatum, TLabel>` |
| Custom            | Extend base context with additional fields         |

**Important**: Use `CartesianSeriesNodeDataContext` (not `SeriesNodeDataContext`) for cartesian series - it includes required `scales` and `visible` properties.

## Existing Series Reference

| Series            | Types Interface          | Base Class          |
| ----------------- | ------------------------ | ------------------- |
| BarSeries         | `BarSeriesTypes`         | `AbstractBarSeries` |
| LineSeries        | `LineSeriesTypes`        | `CartesianSeries`   |
| AreaSeries        | `AreaSeriesTypes`        | `CartesianSeries`   |
| BubbleSeries      | `BubbleSeriesTypes`      | `CartesianSeries`   |
| HistogramSeries   | `HistogramSeriesTypes`   | `CartesianSeries`   |
| HeatmapSeries     | `HeatmapSeriesTypes`     | `CartesianSeries`   |
| RangeBarSeries    | `RangeBarSeriesTypes`    | `AbstractBarSeries` |
| BoxPlotSeries     | `BoxPlotSeriesTypes`     | `AbstractBarSeries` |
| WaterfallSeries   | `WaterfallSeriesTypes`   | `AbstractBarSeries` |
| OhlcSeries        | `OhlcSeriesTypes`        | `OhlcSeriesBase`    |
| CandlestickSeries | `CandlestickSeriesTypes` | `OhlcSeriesBase`    |
| FunnelSeries      | `FunnelSeriesTypes`      | `BaseFunnelSeries`  |
| RangeAreaSeries   | `RangeAreaSeriesTypes`   | `CartesianSeries`   |

## Key Files

- `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeriesTypes.ts` - Base types and extractors
- `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts` - CartesianSeries base
- `packages/ag-charts-community/src/chart/series/cartesian/abstractBarSeries.ts` - AbstractBarSeries base
- `packages/ag-charts-community/src/module-support.ts` - Exports for enterprise use

## Migration Checklist

When converting a series to consolidated types:

- [ ] Create types interface at top of file
- [ ] Extend appropriate base types (`CartesianSeriesTypes` or `AbstractBarSeriesTypes`)
- [ ] Define all 7 type properties (node, options, properties, datum, label, context, stackContext)
- [ ] Update class declaration to use single `TTypes` parameter
- [ ] For enterprise: use `_ModuleSupport.` prefix for all imported types
- [ ] Verify TypeScript compilation passes
- [ ] Run `yarn nx format`
