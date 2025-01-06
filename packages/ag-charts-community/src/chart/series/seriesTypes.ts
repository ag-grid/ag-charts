import type { AgContextMenuOptions } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { Point, SizedPoint } from '../../scene/point';
import { Transformable } from '../../scene/transformable';
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
    NonNullable<AgContextMenuOptions['extraNodeActions']>[number]['action']
>[0];

export interface ISeries<TDatum, TProps, TLabel = TDatum> {
    id: string;
    axes: Record<ChartAxisDirection, ChartAxisLike | undefined>;
    contentGroup: Group;
    properties: TProps;
    hasEventListener(type: string): boolean;
    update(opts: { seriesRect?: BBox }): Promise<void> | void;
    updatePlacedLabelData?(labels: PlacedLabel<TLabel>[]): void;
    fireNodeClickEvent(event: Event, datum: SeriesNodeDatum<unknown>): void;
    fireNodeDoubleClickEvent(event: Event, datum: SeriesNodeDatum<unknown>): void;
    createNodeContextMenuActionEvent(event: Event, datum: TDatum): NodeContextMenuActionEvent;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
    getLabelData(): (TLabel & PointLabelDatum)[];
    getTooltipContent(seriesDatum: any): TooltipContent | string | undefined;
    getDatumAriaText?(seriesDatum: TDatum, description: string): string | undefined;
    // BoundSeries
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): any[];
    getRange(direction: ChartAxisDirection, visibleRange: [number, number]): [number, number];
    getKeys(direction: ChartAxisDirection): string[];
    getKeyProperties(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    getMinRects(width: number, height: number): { minRect: BBox; minVisibleRect: BBox } | undefined;
    datumMidPoint?<T extends SeriesNodeDatum<unknown>>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
    connectsToYAxis: boolean;
}

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum<I> {
    readonly series: ISeries<any, any>;
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

export function getDatumRefPoint(
    datum: SeriesNodeDatum<unknown> & Pick<ErrorBoundSeriesNodeDatum, 'yBar'>
): { canvasX: number; canvasY: number } | undefined {
    // On `line` and `scatter` series, the tooltip covers the top of error-bars when using datum.midPoint.
    // Using datum.yBar.upperPoint renders the tooltip higher up.
    const refPoint = datum.yBar?.upperPoint ?? datum.midPoint ?? datum.series.datumMidPoint?.(datum);
    if (refPoint) {
        const { x, y } = Transformable.toCanvasPoint(datum.series.contentGroup, refPoint.x, refPoint.y);
        return { canvasX: Math.round(x), canvasY: Math.round(y) };
    }
}
