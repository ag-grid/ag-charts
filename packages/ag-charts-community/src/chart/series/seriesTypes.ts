import type { AgContextMenuOptions } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { Point, SizedPoint } from '../../scene/point';
import type { PlacedLabel, PointLabelDatum } from '../../scene/util/labelPlacement';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartLegendDatum, ChartLegendType } from '../legend/legendDatum';
import type { TooltipContent } from '../tooltip/tooltip';

// Breaks circular dependency between ISeries and ChartAxis.
interface ChartAxisLike {
    id: string;
}

// Ensure that the created contextmenu event matches the API option contract:
type NodeContextMenuActionEvent = Parameters<
    // eslint-disable-next-line sonarjs/deprecation
    NonNullable<AgContextMenuOptions['extraNodeActions']>[number]['action']
>[0];

export interface ISeries<TDatumIndex, TDatum, TProps, TLabel = TDatum> {
    id: string;
    axes: { [K in ChartAxisDirection]?: ChartAxisLike };
    contentGroup: Group;
    properties: TProps;
    hasEventListener(type: string): boolean;
    hasData: boolean;
    update(opts: { seriesRect?: BBox }): Promise<void> | void;
    updatePlacedLabelData?(labels: PlacedLabel<TLabel>[]): void;
    fireNodeClickEvent(event: Event, datum: SeriesNodeDatum<unknown>): boolean;
    fireNodeDoubleClickEvent(event: Event, datum: SeriesNodeDatum<unknown>): void;
    createNodeContextMenuActionEvent(event: Event, datum: TDatum): NodeContextMenuActionEvent;
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
    getVisibleItems(xVisibleRange: [number, number], yVisibleRange: [number, number], minVisibleItems: number): number;
    dataCount(): number;
    shouldFlipXY?: () => boolean;
    getKeys(direction: ChartAxisDirection): string[];
    getKeyProperties(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    datumMidPoint?<T extends SeriesNodeDatum<unknown>>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
    connectsToYAxis: boolean;
    tooltipEnabled?: boolean;
}

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum<I> {
    readonly series: ISeries<I, any, any>;
    readonly itemId?: any;
    readonly datum: any;
    readonly datumIndex: I;
    readonly point?: Readonly<Point> & SizedPoint;
    readonly missing?: boolean;
    readonly enabled?: boolean;
    readonly focusable?: boolean;
    midPoint?: Readonly<Point>;
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
