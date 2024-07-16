import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import type { Point, SizedPoint } from '../../scene/point';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { TooltipContent } from '../tooltip/tooltip';
interface ChartAxisLike {
    id: string;
}
export interface ISeries<TDatum, TProps> {
    id: string;
    axes: Record<ChartAxisDirection, ChartAxisLike | undefined>;
    contentGroup: Group;
    properties: TProps;
    hasEventListener(type: string): boolean;
    update(opts: {
        seriesRect?: BBox;
    }): Promise<void>;
    fireNodeClickEvent(event: Event, datum: TDatum): void;
    fireNodeDoubleClickEvent(event: Event, datum: TDatum): void;
    createNodeContextMenuActionEvent(event: Event, datum: TDatum): any;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
    getTooltipHtml(seriesDatum: any): TooltipContent;
    getBandScalePadding?(): {
        inner: number;
        outer: number;
    };
    getDomain(direction: ChartAxisDirection): any[];
    getKeys(direction: ChartAxisDirection): string[];
    getKeyProperties(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    getMinRects(width: number, height: number): {
        minRect: BBox;
        minVisibleRect: BBox;
    } | undefined;
    datumMidPoint?<T extends SeriesNodeDatum>(datum: T): Point | undefined;
    isEnabled(): boolean;
    type: string;
    visible: boolean;
}
/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum {
    readonly series: ISeries<any, any>;
    readonly itemId?: any;
    readonly datum: any;
    readonly point?: Readonly<SizedPoint>;
    readonly missing?: boolean;
    midPoint?: Readonly<Point>;
}
export interface ErrorBoundSeriesNodeDatum {
    readonly capDefaults: {
        lengthRatioMultiplier: number;
        lengthMax: number;
    };
    readonly cumulativeValue?: number;
    xBar?: {
        lowerPoint: Point;
        upperPoint: Point;
    };
    yBar?: {
        lowerPoint: Point;
        upperPoint: Point;
    };
}
export type NodeDataDependencies = {
    seriesRectWidth: number;
    seriesRectHeight: number;
};
export type NodeDataDependant = {
    readonly nodeDataDependencies: NodeDataDependencies;
};
export {};
