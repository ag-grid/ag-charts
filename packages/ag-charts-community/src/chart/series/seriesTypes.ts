import type {
    AreMutuallyExclusive,
    BoxBounds,
    ChartAxisDirection,
    DomainWithMetadata,
    PlacedLabel,
    Point,
    PointLabelDatum,
    SizedPoint,
} from 'ag-charts-core';
import type { AgActiveItemState, SelectionState as PublicSelectionState } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { TypedEvent } from '../../util/observable';
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

export type DatumIndexType = number | object | undefined;
export type ItemId = string;
export type ItemType = 'positive' | 'negative' | 'total' | 'subtotal' | 'up' | 'down' | 'low' | 'high';

// Assert that DatumIndexType and ItemId share no types in common:
true satisfies AreMutuallyExclusive<DatumIndexType, ItemId>;

export type SeriesNodeEventTypes =
    | 'nodeContextMenuAction'
    | 'groupingChanged'
    | 'seriesNodeClick'
    | 'seriesNodeDoubleClick';

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

export interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    // Note: this is typically a MouseEvent, but it can be a TouchEvent or KeyboardEvent too.
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
    readonly itemId: string | number;
    readonly dataIdKey: string | undefined;
    readonly defaultPrevented: boolean;
    readonly selectionState: PublicSelectionState | undefined;
}

export interface ISeriesProperties {
    cursor: string;
    xKey?: string;
    yKey?: string;
    context?: unknown;
    selection: { enabled: boolean };
    tooltip: { enabled?: boolean };
}

export interface ISeries<
    TDatumIndex extends DatumIndexType,
    TDatum,
    TProps extends ISeriesProperties,
    TLabel = TDatum,
> {
    id: string;
    axes: { [K in ChartAxisDirection]?: ChartAxisLike };
    contentGroup: Group;
    properties: TProps;
    events: { emit: (type: 'data-selection-change', event: null) => void };
    hasEventListener(type: string): boolean;
    hasData: boolean;
    update(opts: { seriesRect?: BBox }): Promise<void> | void;
    updatePlacedLabelData?(labels: PlacedLabel<TLabel>[]): void;
    fireNodeClickEvent(event: Event, datum: SeriesNodeDatum<TDatumIndex>): boolean;
    fireNodeDoubleClickEvent(event: Event, datum: SeriesNodeDatum<TDatumIndex>): void;
    createNodeContextMenuActionEvent(event: Event, datum: TDatum): INodeEvent<'nodeContextMenuAction'>;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
    getLabelData(): (TLabel & PointLabelDatum)[];
    getTooltipContent(datumIndex: TDatumIndex, removeThisDatum: TDatum | undefined): TooltipContent | undefined;
    getDatumAriaText?(seriesDatum: TDatum, description: string): string | undefined;
    getCategoryValue(datumIndex: TDatumIndex): any;
    datumIndexForCategoryValue(categoryValue: any): TDatumIndex | undefined;
    isHighlightEnabled(): boolean;
    getSelectionStateString(
        datumIndex: TDatumIndex | undefined,
        selectionState?: SelectionState
    ): PublicSelectionState | undefined;
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
    datumMidPoint?<T extends SeriesNodeDatum<TDatumIndex>>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
    connectsToYAxis: boolean;
    tooltipEnabled?: boolean;
    // @todo(AG-13777) - Remove this function (see CartesianSeries.ts)
    minTimeInterval(): number | undefined;
    isPointInArea?(x: number, y: number): boolean;
    findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): SeriesNodeDatum<DatumIndexType> | undefined;
    readonly data?: DataSet<any>;
    pickNodesInBBox(bbox: BoxBounds): Iterable<TDatum>;
    ensureBucketLookupFeature(): BucketLookupFeature | undefined;
}

type SeriesNodeDatumSeries<I extends DatumIndexType> = ISeries<I, SeriesNodeDatum<I>, ISeriesProperties, unknown>;

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum<I extends DatumIndexType> {
    readonly series: SeriesNodeDatumSeries<I>;
    readonly itemId?: ItemId;
    readonly itemType?: ItemType;
    readonly datum: unknown;
    readonly datumIndex: I;
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
