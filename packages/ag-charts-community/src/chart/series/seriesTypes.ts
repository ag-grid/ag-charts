import type {
    ChartAxisDirection,
    DomainWithMetadata,
    PlacedLabel,
    Point,
    PointLabelDatum,
    SizedPoint,
} from 'ag-charts-core';
import type { InteractionRange } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { Path } from '../../scene/shape/path';
import type { TypedEvent } from '../../util/observable';
import type { ChartLegendDatum, ChartLegendType } from '../legend/legendDatum';
import type { TooltipContent } from '../tooltip/tooltipContent';

// Breaks circular dependency between ISeries and ChartAxis.
interface ChartAxisLike {
    id: string;
}

export type DatumIndexType = number | object | undefined;
export type ItemId = number | string;
export type ItemType = 'positive' | 'negative' | 'total' | 'subtotal' | 'up' | 'down' | 'low' | 'high';

export type SeriesNodeEventTypes =
    | 'nodeContextMenuAction'
    | 'groupingChanged'
    | 'seriesNodeClick'
    | 'seriesNodeDoubleClick';

/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE,
    /** Pick matches based upon distance from axis */
    AXIS_ALIGNED,
}

export type SeriesNodePickIntent = 'tooltip' | 'highlight' | 'highlight-tooltip' | 'context-menu' | 'event';

export type PickFocusInputs = {
    // datum delta is strictly +ve/-ve when changing datum focus, or 0 when changing series focus.
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    // 'other' means 'depth' for hierarchical charts, or 'series' for all other charts
    readonly otherIndex: number;
    readonly otherIndexDelta: number;
    readonly seriesRect?: BBox;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum<DatumIndexType>;
    otherIndex?: number;
    bounds: BBox | Path;
    movedBounds?: BBox;
    clipFocusBox: boolean;
};

export type PickResult = {
    pickMode: SeriesNodePickMode;
    datums: SeriesNodeDatum<DatumIndexType>[];
    distance: number;
};

export type PickedSeries = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, IProperties, unknown>;

export interface PickedNode {
    series: PickedSeries;
    datum: SeriesNodeDatum<DatumIndexType>;
    datumIndex: unknown;
}

export type PickedNodes = {
    matches: PickedNode[];
    distance: number;
};

export interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    // Note: this is typically a MouseEvent, but it can be a TouchEvent or KeyboardEvent too.
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
    readonly defaultPrevented: boolean;
}

export interface IProperties {
    readonly focusPriority?: number;
    readonly tooltip: { readonly range?: InteractionRange };
}

export interface ISeries<TDatumIndex extends DatumIndexType, TDatum, TProps extends IProperties, TLabel = TDatum> {
    id: string;
    axes: { [K in ChartAxisDirection]?: ChartAxisLike };
    contentGroup: Group;
    declarationOrder: number;
    properties: TProps;
    readonly focusable: boolean;
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
    // BoundSeries
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): DomainWithMetadata<any>;
    getRange(direction: ChartAxisDirection, visibleRange: [number, number]): any[];
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

    // Node-picking (pointer/keyboard/setState):
    pickNodes(point: Point, intent: SeriesNodePickIntent, exactMatchOnly: boolean | undefined): PickResult | undefined;
    pickFocus(opts: PickFocusInputs): PickFocusOutputs | undefined;
    findNodeDatum(itemId: ItemId): TDatum | undefined;
}

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum<I extends DatumIndexType> {
    readonly series: ISeries<I, any, any>;
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
