import type {
    BoxBounds,
    CandidateStyleResolver,
    ChartAxisDirection,
    DomainWithMetadata,
    LabelObstacle,
    PlacedLabel,
    Point,
    PointLabelDatum,
    PositionedCandidateResolver,
    SeriesLabelDefaults,
    SizedPoint,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgCoordinates,
    AgHitParams,
    AgNodeClickParams,
    AgNodeContextMenuActionEvent,
    AgNumericValue,
    SelectionState as PublicSelectionState,
} from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import type { ProcessedData } from '../data/dataModelTypes';
import type { DataSet } from '../data/dataSet';
import type { ChartLegendDatum, ChartLegendType } from '../legend/legendDatum';
import type { TooltipContent } from '../tooltip/tooltipContent';
import type { AggregationFilterBase } from './aggregationManager';

export enum HighlightState {
    None,
    Item,
    Series,
    OtherSeries,
    OtherItem,
}

export enum SelectionState {
    None,
    Item,
    OtherItem,
    OtherSeries,
}

// Breaks circular dependency between ISeries and ChartAxis.
interface ChartAxisLike {
    id: string;
}

export type DatumIndex = number;
export type ItemId = string;
export type ItemType = 'positive' | 'negative' | 'total' | 'subtotal' | 'up' | 'down' | 'low' | 'high';

export type SeriesNodeEventTypes = 'nodeContextMenuAction' | 'seriesNodeClick' | 'seriesNodeDoubleClick';

export type DatumRangeReader = (sampledDatumIndex: number) => [number, number] | undefined;

/**
 * Aggregation-aware bucket lookup surface every aggregating series exposes
 * to the rest of the framework. Implementations live in `bucketLookupFeature.ts`
 * (`BucketLookupManager`, `SplitBucketLookupManager`).
 *
 * Declared here rather than imported from `bucketLookupFeature.ts` so the
 * implementation file can pull `DatumRangeReader` from `seriesTypes.ts`
 * without forming a cycle.
 */
export interface BucketLookupFeature {
    /**
     * Whether the bucket containing `datumIndex` at the active zoom level
     * contains any selected datums. `undefined` when no aggregation level is
     * active for the current view.
     */
    isBucketSelected(datumIndex: number): boolean | undefined;
    /** Build a {@link DatumRangeReader} for the active aggregation level. */
    getRangeReader(): DatumRangeReader | undefined;
    /**
     * Underlying datum indices for the cluster represented by `datumIndex`,
     * or `undefined` when the active aggregation model doesn't expose an
     * index set (extremes/split managers) or no clustering is active for
     * the current view.
     *
     * Bubble/scatter use cluster-based aggregation: each rendered marker
     * stands in for an arbitrary group of datums whose underlying indices
     * are non-contiguous. Drag-select fans out to these underlying indices.
     */
    getIndexSet(datumIndex: number): Iterable<number> | undefined;
    /** Recompute the per-bucket SELECTED slot across every cached aggregation level. */
    refresh(): void;
    /** Render-pass entrypoint — series pushes the resolved filter directly, skipping the lazy axis-poll path. */
    setActiveFilter(processedData: ProcessedData<any>, filter: AggregationFilterBase | undefined): void;
}

export interface ISeriesAriaMeta {
    readonly text: string;
    readonly instructions?: string[];
}

export type FireNodeEventParams = {
    event: Event;
    /** Every node picked at this point, flat and in hit-test order; may span several series. */
    datums: SeriesNodeDatum[];
    /**
     * Index into `datums` of the node whose params are flattened onto the event root. Historically, click events only
     * ever reported 1 series-node at most. Nowadays, left/right click events report all series-nodes that overlap at
     * this click-point (`allHitParams` / `allShowOnParams` ). The `winner` is that series-node for backward
     * compatibility.
     */
    winner: number;
    coordinates: AgCoordinates | undefined;
    // Params for elements of other kinds picked at the same point (e.g. currently cross lines
    otherHitParams?: AgHitParams<unknown>[];
};

export interface ISeriesProperties {
    cursor: string;
    xKey?: string;
    yKey?: string;
    context?: unknown;
    tooltip: { enabled?: boolean };
}

export interface ISeries<TDatum extends SeriesNodeDatum, TProps extends ISeriesProperties, TLabel = TDatum> {
    id: string;
    axes: { [K in ChartAxisDirection]?: ChartAxisLike };
    contentGroup: Group;
    properties: TProps;
    events: { emit: (type: 'data-selection-change', event: null) => void };
    hasNodeClickListener(): boolean;
    /** Whether a click on `target` triggers a built-in interaction (e.g. the org-chart expander). */
    hasBuiltinListener(target: Node<unknown> | undefined): boolean;
    /**
     * Whether a pointer event on `target` counts as activating the datum — reaching the user's
     * `seriesNodeClick` and `seriesNodeDoubleClick` listeners, and updating data selection. `false`
     * for dedicated controls that own their clicks outright, such as the org-chart expander pill.
     */
    firesUserClickListeners(target: Node<unknown> | undefined): boolean;
    /**
     * Names the part of the node `target` belongs to, for series rendering several parts per node (e.g.
     * the org-chart card and its expander pill); `undefined` when the series draws no such distinction.
     * The value rides along with the highlight, which still rolls up to the node itself.
     */
    getHighlightPart(target: Node<unknown> | undefined): string | undefined;
    hasData: boolean;
    update(opts: { seriesRect?: BBox }): Promise<void> | void;
    updatePlacedLabelData?(labels: PlacedLabel<TLabel>[]): void;
    fireNodeClickEvent(opts: FireNodeEventParams): boolean;
    fireNodeDoubleClickEvent(opts: FireNodeEventParams): boolean;
    createNodeContextMenuActionEvent(opts: FireNodeEventParams): AgNodeContextMenuActionEvent;
    createNodeParams(datum: TDatum): Omit<AgNodeClickParams<unknown>, 'type'>;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
    getLabelData(): PointLabelDatum[];
    /** Series-level collision defaults applied to every label the engine places for this series. */
    getLabelDefaults?(): SeriesLabelDefaults | undefined;
    /**
     * Resolves each label's `itemStyler` geometry per candidate placement, so the engine reserves and
     * tests the styled box. `undefined` when no styler can change it.
     */
    getLabelCandidateStyler?(): CandidateStyleResolver | undefined;
    /**
     * Resolves one pre-positioned candidate's `itemStyler` geometry, called as the cascade reaches it so a
     * styler never runs for a fallback the label did not need. `undefined` when no styler can change it.
     */
    getLabelCandidateResolver?(): PositionedCandidateResolver | undefined;
    getLabelObstacles?(): LabelObstacle[] | undefined;
    getTooltipContent(datumIndex: DatumIndex, removeThisDatum: TDatum | undefined): TooltipContent | undefined;
    getDatumAriaMeta(seriesDatum: TDatum, description: string): ISeriesAriaMeta | undefined;
    getCategoryValue(datumIndex: number): any;
    datumIndexForCategoryValue(categoryValue: any): DatumIndex | undefined;
    isHighlightEnabled(): boolean;
    isSelectionEnabled(): boolean;
    isDatumSelectable(datumIndex: DatumIndex): boolean;
    getDataSelectionState(datumIndex: DatumIndex | undefined): SelectionState | undefined;
    getSelectionStateString(
        datumIndex: DatumIndex | undefined,
        selectionState?: SelectionState
    ): PublicSelectionState | undefined;
    getCollapsedState(itemId: string | number): boolean | undefined;
    // BoundSeries
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): DomainWithMetadata<any>;
    getRange(direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] | [];
    getMinimumRangeSeries(ranges: number[]): void;
    getMinimumRangeChart(ranges: number[]): number;
    getZoomRangeFittingItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined;
    getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number;
    dataCount(): number;
    shouldFlipXY?: () => boolean;
    getKeyAxis(direction: ChartAxisDirection): string | undefined;
    getKeys(direction: ChartAxisDirection): string[];
    getKeyProperties(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    getFormatterContext(
        direction: ChartAxisDirection
    ): Array<{ seriesId: string; key: string; name: string | undefined }>;
    resolveKeyDirection(direction: ChartAxisDirection): ChartAxisDirection;
    datumMidPoint?<T extends SeriesNodeDatum>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
    usesPlacedLabels: boolean;
    /** Increments on every node-data invalidation; lets label placement skip unchanged inputs. */
    nodeDataVersion: number;
    connectsToYAxis: boolean;
    tooltipEnabled?: boolean;
    // @todo(AG-13777) - Remove this function (see CartesianSeries.ts)
    minTimeInterval(): number | undefined;
    isPointInArea?(x: number, y: number): boolean;
    findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): SeriesNodeDatum | undefined;
    readonly data?: DataSet<any>;
    pickNodesInBBox(bbox: BoxBounds): Iterable<TDatum>;
    ensureBucketLookupFeature(): BucketLookupFeature | undefined;
}

type SeriesNodeDatumSeries = ISeries<SeriesNodeDatum, ISeriesProperties, unknown>;

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum {
    readonly series: SeriesNodeDatumSeries;
    readonly itemId?: ItemId;
    readonly itemType?: ItemType;
    readonly datum: unknown;
    readonly datums?: unknown[];
    /** Waterfall series only: the computed cumulative value for `total`/`subtotal` bars. */
    readonly totalValue?: AgNumericValue;
    /**
     * Full-precision counterpart of {@link ErrorBoundSeriesNodeDatum.cumulativeValue}, which narrows to
     * Number for geometry/arithmetic. Display surfaces (e.g. the crosshair label) read this so a bigint
     * value keeps full precision rather than the float64-rounded `cumulativeValue`.
     */
    readonly cumulativeValueExact?: AgNumericValue;
    readonly datumIndex: DatumIndex;
    readonly point?: Readonly<Point> & SizedPoint;
    readonly missing?: boolean;
    readonly enabled?: boolean;
    readonly focusable?: boolean;
    midPoint?: Readonly<Point>;
    readonly style?: unknown;
}

export interface ErrorBoundSeriesNodeDatum {
    // Caps can appear on bar, line and scatter series. The length is determined
    // by the size of the marker (line, scatter), width of the bar (vertical
    // bars), or height of the bar (horizontal bars).
    readonly capDefaults: { lengthRatioMultiplier: number; lengthMax: number };
    readonly cumulativeValue?: number;
    xBar?: { lowerPoint: Point; upperPoint: Point };
    yBar?: { lowerPoint: Point; upperPoint: Point };
}

export type NodeDataDependencies = { seriesRectWidth: number; seriesRectHeight: number };
export type NodeDataDependant = { readonly nodeDataDependencies: NodeDataDependencies };
