import { expect } from 'vitest';

import type { Node } from 'ag-charts-core';

import type { SeriesNodeDataContext, UnknownSeries } from '../series/series';
import type { SeriesNodeDatum } from '../series/seriesTypes';
import { type ChartOrProxy, type LegendTestInternals, type LegendTestItemNode, deproxy } from './utils';

/** The series at `index`, asserted to exist: a series the chart did not create fails here, not on a later read. */
export function getSeriesAt(chartOrProxy: ChartOrProxy<any>, index = 0): UnknownSeries {
    const series = deproxy(chartOrProxy).series[index];
    expect(series, `series ${index}`).toBeDefined();
    return series;
}

/**
 * The options the series resolved after theming, as the series reads them. `TOptions` is the type the test reads
 * from them (`AgBarSeriesOptions`, …); the series only knows them as an opaque object.
 */
export function getSeriesOptions<TOptions extends object = Record<string, unknown>>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): TOptions {
    return getSeriesAt(chartOrProxy, index).options as unknown as TOptions;
}

// `getNodeData` is declared by the data-model series, not by the `Series` base the chart lists.
interface NodeDataHost<TDatum> {
    getNodeData?: () => TDatum[] | undefined;
}

/**
 * The datums the series built its nodes from (`getNodeData()`), empty before the series has produced any. Fails for a
 * series that does not expose node data at all, so a test cannot pass over a series type that never did.
 */
export function getSeriesNodeData<TDatum = SeriesNodeDatum>(chartOrProxy: ChartOrProxy<any>, index = 0): TDatum[] {
    const series = getSeriesAt(chartOrProxy, index) as unknown as NodeDataHost<TDatum>;
    expect(series.getNodeData, `series ${index} node data`).toBeTypeOf('function');
    return series.getNodeData!() ?? [];
}

/** A series' node-data context; `visible` is kept by the cartesian series, which flag a hidden series on it. */
export interface SeriesContextNodeData<TDatum = SeriesNodeDatum, TLabel = TDatum> extends SeriesNodeDataContext<
    TDatum,
    TLabel
> {
    visible?: boolean;
}

// The cartesian series expose their context through a getter; the data-model `Series` base does not declare it.
interface ContextNodeDataHost<TDatum, TLabel> {
    contextNodeData?: SeriesContextNodeData<TDatum, TLabel>;
}

/**
 * The node-data context of the series (`nodeData`, `labelData`, `visible`, …), asserted to exist: a series that has
 * not produced one, or never keeps one, fails here rather than on the read that unpacks it.
 */
export function getSeriesContextNodeData<TDatum = SeriesNodeDatum, TLabel = TDatum>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): SeriesContextNodeData<TDatum, TLabel> {
    const { contextNodeData } = getSeriesAt(chartOrProxy, index) as unknown as ContextNodeDataHost<TDatum, TLabel>;
    expect(contextNodeData, `series ${index} node data context`).toBeDefined();
    return contextNodeData!;
}

// `hasChangesOnHighlight` is protected on `Series`: it is the flag that asks the series for a full redraw.
interface HighlightRedrawHost {
    hasChangesOnHighlight?: boolean;
}

/** Whether the series asked for a full redraw on its last highlight change (its protected `hasChangesOnHighlight`). */
export function getSeriesHasChangesOnHighlight(chartOrProxy: ChartOrProxy<any>, index = 0): boolean {
    const { hasChangesOnHighlight } = getSeriesAt(chartOrProxy, index) as unknown as HighlightRedrawHost;
    expect(hasChangesOnHighlight, `series ${index} highlight redraw flag`).toBeTypeOf('boolean');
    return hasChangesOnHighlight!;
}

/** The scene selections of a series that tests read the drawn nodes through. */
export type SeriesSelectionName =
    'datumSelection' | 'labelSelection' | 'highlightSelection' | 'highlightLabelSelection' | 'itemSelection';

/**
 * The nodes a series drew into one of its selections, in selection order. Which selections a series has depends on its
 * family (cartesian series have `datumSelection`, polar ones `itemSelection`); naming one the series lacks fails.
 * Prefer the scene-graph accessors (`createSceneGeometrySampler`) when only geometry or counts matter.
 */
export function getSeriesSelectionNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    name: SeriesSelectionName,
    index = 0
): TNode[] {
    const host = getSeriesAt(chartOrProxy, index) as unknown as Partial<
        Record<SeriesSelectionName, { nodes(): TNode[] }>
    >;
    const selection = host[name];
    expect(selection, `series ${index} ${name}`).toBeDefined();
    return selection!.nodes();
}

/**
 * The item nodes of every legend the chart has, in legend order and, within a legend, in item order. A legend without
 * items (the gradient legend of a heatmap) contributes none.
 */
export function getLegendItemNodes(chartOrProxy: ChartOrProxy<any>): (LegendTestItemNode & Node)[] {
    return Array.from(deproxy(chartOrProxy).modulesManager.legends()).flatMap(
        ({ legend }) => (legend as unknown as Partial<LegendTestInternals>).itemSelection?.nodes() ?? []
    );
}

// The series-area manager keeps its focus private; `Chart.seriesAreaManager` is protected. The rect it lays out is
// `Chart.seriesRect`, which `getSeriesRect` (axisAccessors) reads.
interface SeriesAreaManagerHost {
    seriesAreaManager?: { focus: { seriesIndex: number; datumIndex: number } };
}

function getSeriesAreaManager(
    chartOrProxy: ChartOrProxy<any>
): NonNullable<SeriesAreaManagerHost['seriesAreaManager']> {
    const { seriesAreaManager } = deproxy(chartOrProxy) as unknown as SeriesAreaManagerHost;
    expect(seriesAreaManager).toBeDefined();
    return seriesAreaManager!;
}

/** The series and datum the keyboard focus is on, as the series-area manager tracks it. */
export function getSeriesAreaFocus(chartOrProxy: ChartOrProxy<any>): { seriesIndex: number; datumIndex: number } {
    const { seriesIndex, datumIndex } = getSeriesAreaManager(chartOrProxy).focus;
    return { seriesIndex, datumIndex };
}

/**
 * Sets the `agChartsDebug` flag the chart reads its debug selectors from, and returns the function that puts the
 * previous value back. Debug logging is switched on by a global, so there is no option to pass instead.
 */
export function setAgChartsDebug(selectors: boolean | string | (boolean | string)[]): () => void {
    const previous = Reflect.has(globalThis, 'agChartsDebug') ? Reflect.get(globalThis, 'agChartsDebug') : undefined;
    Reflect.set(globalThis, 'agChartsDebug', selectors);
    return () => {
        if (previous === undefined) {
            Reflect.deleteProperty(globalThis, 'agChartsDebug');
        } else {
            Reflect.set(globalThis, 'agChartsDebug', previous);
        }
    };
}
