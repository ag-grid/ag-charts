import { expect } from 'vitest';

import type { LabelObstacle, Node, Path, PlacedLabel, PointLabelDatum, RotatableText, Text } from 'ag-charts-core';

import type { AreaFillPathDatum, MarkerSelectionDatum } from '../series/cartesian/areaUtil';
import type { BarSeries } from '../series/cartesian/barSeries';
import type { HistogramSeries } from '../series/cartesian/histogramSeries';
import type { LineNodeDatum, LineStrokePathDatum } from '../series/cartesian/lineUtil';
import {
    type SeriesContextNodeData,
    type SeriesSelectionName,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
} from './seriesAccessors';
import { type ChartOrProxy, deproxy } from './utils';

// `placedLabelData` is protected on the series that run the placement engine (line, area, scatter, bubble, …).
interface PlacedLabelHost<TDatum extends PointLabelDatum> {
    placedLabelData?: PlacedLabel<TDatum>[];
}

/**
 * The labels the placement engine settled on for a series: where each sits, which candidate placement it took and the
 * datum it was placed for. `TDatum` is the label datum the test reads (the series' node datum is nested under
 * `datum.datum`). Fails for a series that keeps no placed labels, so a test cannot pass over a series type that never did.
 */
export function getPlacedLabelData<TDatum extends PointLabelDatum = PointLabelDatum>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): PlacedLabel<TDatum>[] {
    const { placedLabelData } = getSeriesAt(chartOrProxy, index) as unknown as PlacedLabelHost<TDatum>;
    expect(placedLabelData, `series ${index} placed labels`).toBeDefined();
    return placedLabelData!;
}

// `getLabelObstacles` is declared by `ISeries` as optional; only the series that contribute obstacles implement it.
interface LabelObstacleHost {
    getLabelObstacles?: () => LabelObstacle[] | undefined;
}

/**
 * The obstacles a series hands the label placement engine so other series' labels avoid it, empty when it contributes
 * none. Fails for a series that cannot contribute obstacles at all.
 */
export function getSeriesLabelObstacles(chartOrProxy: ChartOrProxy<any>, index = 0): LabelObstacle[] {
    const series = getSeriesAt(chartOrProxy, index) as unknown as LabelObstacleHost;
    expect(series.getLabelObstacles, `series ${index} label obstacles`).toBeTypeOf('function');
    return series.getLabelObstacles!() ?? [];
}

/**
 * The label nodes a series has on the scene graph and is showing, in selection order. `selection` picks the labels
 * drawn for the datums (`labelSelection`, the default) or for the highlighted datum (`highlightLabelSelection`).
 * `TDatum` is the datum the series wrote onto each label node.
 * Use `getVisibleLabelNodes` (`utils`) instead when only text, size, position or the datum are read of the datums'
 * labels; this one is for the highlight selection and for what `RotatableText` adds (`getBBox`, `rotation`, boxing).
 */
export function getVisibleLabelTextNodes<TDatum = unknown>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0,
    selection: Extract<SeriesSelectionName, 'labelSelection' | 'highlightLabelSelection'> = 'labelSelection'
): RotatableText<TDatum>[] {
    return getSeriesSelectionNodes<RotatableText<TDatum>>(chartOrProxy, selection, index).filter(
        (node) => node.visible
    );
}

// The box a label draws behind its text is private to `Text`; `Rect.cornerRadius` is write-only, so the resolved
// radius is read back off the box's first corner.
interface LabelBoxHost {
    boxing?: { topLeftCornerRadius: number };
}

/** The corner radius of the box behind a label's text, or `undefined` when the label draws no box. */
export function getLabelBoxCornerRadius(node: Text): number | undefined {
    return (node as unknown as LabelBoxHost).boxing?.topLeftCornerRadius;
}

// The area series' two paths are private to the cartesian series, which builds them from `pathsPerSeries`.
interface PathsHost {
    paths?: Path[];
}

/**
 * The paths a cartesian series draws its line or area with. An area series has its fill first and its stroke second.
 * Fails for a series that draws none.
 */
export function getSeriesPaths(chartOrProxy: ChartOrProxy<any>, index = 0): Path[] {
    const { paths } = getSeriesAt(chartOrProxy, index) as unknown as PathsHost;
    expect(paths, `series ${index} paths`).toBeDefined();
    return paths!;
}

/**
 * The bins a histogram series computed from its data, in bin order, before they are turned into bars. Fails for a
 * series that is not a histogram.
 */
export function getHistogramBins(chartOrProxy: ChartOrProxy<any>, index = 0): HistogramSeries['calculatedBins'] {
    const { calculatedBins } = getSeriesAt(chartOrProxy, index) as unknown as Partial<
        Pick<HistogramSeries, 'calculatedBins'>
    >;
    expect(calculatedBins, `series ${index} bins`).toBeDefined();
    return calculatedBins!;
}

/** Series options the series read but the public option types leave out: cross-filtering and null-key handling. */
export interface UndocumentedSeriesOptions {
    selectedKey?: string;
    yFilterKey?: string;
    allowNullKeys?: boolean;
}

/**
 * The series options with the undocumented ones added. The public option types do not declare them, so a literal that
 * names them is rejected; spreading them in keeps the series options typed instead of casting the literal.
 */
export function withUndocumentedOptions<TSeries extends object>(
    series: TSeries,
    undocumented: UndocumentedSeriesOptions
): TSeries & UndocumentedSeriesOptions {
    return { ...series, ...undocumented };
}

/**
 * The node-data context of a line or area series: its nodes plus the spans its stroke is drawn from and, for an area,
 * the spans of its fill.
 */
export interface PathSeriesContextNodeData extends SeriesContextNodeData<LineNodeDatum | MarkerSelectionDatum> {
    strokeData: LineStrokePathDatum;
    fillData?: AreaFillPathDatum;
}

/** The context of a line or area series, asserted to carry the stroke spans that only those series build. */
export function getPathSeriesContextNodeData(chartOrProxy: ChartOrProxy<any>, index = 0): PathSeriesContextNodeData {
    const context = getSeriesContextNodeData(chartOrProxy, index) as unknown as Partial<PathSeriesContextNodeData>;
    expect(context.strokeData, `series ${index} stroke spans`).toBeDefined();
    return context as PathSeriesContextNodeData;
}

// `gridLineGroup` is protected on every axis; `ChartAxis`, the type the chart lists its axes as, does not declare it.
interface GridLineHost {
    gridLineGroup?: { visible: boolean };
}

/** Whether each of the chart's axes shows its grid lines, in axis order. Fails for an axis that has no grid lines. */
export function getAxisGridLineVisibility(chartOrProxy: ChartOrProxy<any>): boolean[] {
    return deproxy(chartOrProxy).axes.map((axis) => {
        const { gridLineGroup } = axis as unknown as GridLineHost;
        expect(gridLineGroup, `axis ${axis.id} grid lines`).toBeDefined();
        return gridLineGroup!.visible;
    });
}

// `xCoordinateRange` is protected on the cartesian series; the bubble series makes it public.
interface XCoordinateRangeHost {
    xCoordinateRange?: (xValue: number, pixelSize: number, datumIndex: number) => [number, number];
}

/**
 * The horizontal extent a datum's marker covers, as the series measures it when it scans for the datums in view.
 * Fails for a series that does not size its datums this way.
 */
export function getXCoordinateRange(
    chartOrProxy: ChartOrProxy<any>,
    xValue: number,
    pixelSize: number,
    datumIndex: number,
    seriesIndex = 0
): [number, number] {
    const series = getSeriesAt(chartOrProxy, seriesIndex) as unknown as XCoordinateRangeHost;
    expect(series.xCoordinateRange, `series ${seriesIndex} x coordinate range`).toBeTypeOf('function');
    return series.xCoordinateRange!(xValue, pixelSize, datumIndex);
}

/** The node datum a bar series builds for each bar, which the series module does not export. */
export type BarNodeDatum = NonNullable<ReturnType<BarSeries['getNodeData']>>[number];

/**
 * The node-data context of a bar series. `phantomNodeData` holds the unfiltered counterpart of each bar for a series
 * with a `yFilterKey`.
 */
export interface BarSeriesContextNodeData extends SeriesContextNodeData<BarNodeDatum> {
    phantomNodeData: BarNodeDatum[];
}

/** The context of a bar series, asserted to carry the phantom nodes that only bar series build. */
export function getBarSeriesContextNodeData(chartOrProxy: ChartOrProxy<any>, index = 0): BarSeriesContextNodeData {
    const context = getSeriesContextNodeData(chartOrProxy, index) as unknown as Partial<BarSeriesContextNodeData>;
    expect(context.phantomNodeData, `series ${index} phantom node data`).toBeDefined();
    return context as BarSeriesContextNodeData;
}

// The processed data a series keeps from its last data pass is protected; the bar series reduce a flag onto it.
interface ProcessedDataHost {
    processedData?: { reduced?: { filteredValueExceedUnfiltered?: boolean } };
}

/**
 * Whether a bar series found a filtered value (`yFilterKey`) larger than the value it filters, which turns the
 * filtered overlay into a bar of its own. Fails for a series that did not reduce the flag.
 */
export function getFilteredValueExceedUnfiltered(chartOrProxy: ChartOrProxy<any>, index = 0): boolean {
    const { processedData } = getSeriesAt(chartOrProxy, index) as unknown as ProcessedDataHost;
    const flag = processedData?.reduced?.filteredValueExceedUnfiltered;
    expect(flag, `series ${index} filtered-value flag`).toBeDefined();
    return flag!;
}

// `toggleSeriesItem` is protected on `Series`; it is what a click on a legend item reaches.
interface LegendItemToggleHost {
    toggleSeriesItem?: (
        enabled: boolean,
        legendType: 'category',
        itemId: string | number | undefined,
        legendItemName: string | undefined
    ) => void;
}

/**
 * Shows or hides one item of a series (a pie sector, say) the way a legend click does, without going through the
 * legend's pixels. The caller updates the chart afterwards. Fails for a series that cannot toggle its items.
 */
export function toggleSeriesLegendItem(
    chartOrProxy: ChartOrProxy<any>,
    enabled: boolean,
    itemId: string | number,
    seriesIndex = 0
): void {
    const series = getSeriesAt(chartOrProxy, seriesIndex) as unknown as LegendItemToggleHost;
    expect(series.toggleSeriesItem, `series ${seriesIndex} legend item toggle`).toBeTypeOf('function');
    series.toggleSeriesItem!(enabled, 'category', itemId, undefined);
}

// The callout labels of a pie or donut series are kept in a private selection, tagged by what each node draws.
interface CalloutHost {
    calloutLabelSelection?: { selectByTag<TNode extends Node>(tag: number): TNode[] };
}

/**
 * The scene nodes a pie or donut series drew for one part of its callouts (`DonutNodeTag.CalloutLabel`, …), in
 * selection order. Fails for a series that has no callouts.
 */
export function getSeriesCalloutNodes<TNode extends Node = Node>(
    chartOrProxy: ChartOrProxy<any>,
    tag: number,
    index = 0
): TNode[] {
    const { calloutLabelSelection } = getSeriesAt(chartOrProxy, index) as unknown as CalloutHost;
    expect(calloutLabelSelection, `series ${index} callouts`).toBeDefined();
    return calloutLabelSelection!.selectByTag<TNode>(tag);
}
