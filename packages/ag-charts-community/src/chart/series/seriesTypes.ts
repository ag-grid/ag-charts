import type { PlacedLabel, Point, PointLabelDatum, SizedPoint } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { TypedEvent } from '../../util/observable';
import type { ChartAxisDirection } from '../chartAxisDirection';
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

export interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    // Note: this is typically a MouseEvent, but it can be a TouchEvent or KeyboardEvent too.
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
    readonly defaultPrevented: boolean;
}

export interface ISeries<TDatumIndex extends DatumIndexType, TDatum, TProps, TLabel = TDatum> {
    id: string;
    axes: { [K in ChartAxisDirection]?: ChartAxisLike };
    contentGroup: Group;
    properties: TProps;
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
    // BoundSeries
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): any[];
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
    datumMidPoint?<T extends SeriesNodeDatum<TDatumIndex>>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
    connectsToYAxis: boolean;
    tooltipEnabled?: boolean;
    // @todo(AG-13777) - Remove this function (see CartesianSeries.ts)
    minTimeInterval(): number | undefined;
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
