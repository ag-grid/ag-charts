// import type { ChartAxis } from "./chartAxis";
// import type { ChartAxisDirection } from "./chartAxisDirection";

//import type { BBox } from '../scene/bbox';
import type { InteractionRange } from '../options/options/types';
import type { BBox } from '../scene/bbox';
import type { Group } from '../scene/group';
import type { ZIndexSubOrder } from '../scene/node';
import type { Point, SizedPoint } from '../scene/point';
import type { PlacedLabel, PointLabelDatum } from '../util/labelPlacement';
import type { ModuleMap } from '../util/moduleMap';
import type { TypedEventListener } from '../util/observable';
import type { ChartAxis } from './chartAxis';
import type { ChartAxisDirection } from './chartAxisDirection';
import type { DataController } from './data/dataController';
import type { ChartLegendDatum, ChartLegendType } from './legendDatum';
import type { SeriesGrouping } from './series/seriesStateManager';
import type { TooltipPosition } from './tooltip/tooltip';

/**
 * Processed series datum used in node selections,
 * contains information used to render pie sectors, bars, markers, etc.
 */
export interface SeriesNodeDatum {
    // For example, in `sectorNode.datum.seriesDatum`:
    // `sectorNode` - represents a pie sector
    // `datum` - contains metadata derived from the immutable series datum and used
    //           to set the properties of the node, such as start/end angles
    // `datum` - raw series datum, an element from the `series.data` array
    readonly series: ChartSeries;
    readonly itemId?: any;
    readonly datum: any;
    readonly point?: Readonly<SizedPoint>;
    nodeMidPoint?: Readonly<Point>;
}

/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH,
    /** Pick matches by nearest category/X-axis value, then distance within that category/X-value. */
    NEAREST_BY_MAIN_AXIS_FIRST,
    /** Pick matches by nearest category value, then distance within that category. */
    NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE,
}

interface ChartSeriesTooltip {
    enabled: boolean;
    showArrow?: boolean;

    // @Validate(OPT_FUNCTION)
    // renderer?: (params: P) => string | AgTooltipRendererResult = undefined;

    // @Validate(OPT_STRING)
    // format?: string = undefined;

    interaction?: { enabled: boolean };

    position: TooltipPosition;

    // toTooltipHtml(
    //     defaults: AgTooltipRendererResult,
    //     params: P,
    //     overrides?: Partial<{ format: string; renderer: (params: P) => string | AgTooltipRendererResult }>
    // ) {
    //     const formatFn = overrides?.format ?? this.format;
    //     const rendererFn = overrides?.renderer ?? this.renderer;
    //     if (formatFn) {
    //         return toTooltipHtml(
    //             {
    //                 content: interpolate(formatFn, params),
    //             },
    //             defaults
    //         );
    //     }
    //     if (rendererFn) {
    //         return toTooltipHtml(rendererFn(params), defaults);
    //     }
    //     return toTooltipHtml(defaults);
    // }
}

export interface ChartSeries {
    pickNode(
        point: Point,
        limitPickModes?: SeriesNodePickMode[]
    ): { pickMode: SeriesNodePickMode; match: SeriesNodeDatum; distance: number } | undefined;
    showInLegend: boolean;
    getLabelData(): PointLabelDatum[];
    type: string;
    id: string;
    data?: any[];
    seriesGrouping?: SeriesGrouping;
    getModuleMap(): ModuleMap<any, any, any>;
    update(opts: { seriesRect?: BBox }): Promise<void>;
    hasData(): boolean | undefined;
    getLegendData(legendType: ChartLegendType): ChartLegendDatum[];
    markNodeDataDirty(): void;
    removeEventListener(key: string, cb: TypedEventListener): void;
    clearEventListeners(): void;
    highlightGroup: Group;
    addChartEventListeners(): void;
    chart?: {
        mode: 'standalone' | 'integrated';
        placeLabels(): Map<ChartSeries, PlacedLabel[]>;
        getSeriesRect(): Readonly<BBox> | undefined;
    };
    setChartData(input: unknown[]) : void;
    rootGroup: Group;
    contentGroup: Group;
    getGroupZIndexSubOrder(
        type: 'data' | 'labels' | 'highlight' | 'path' | 'marker' | 'paths',
        subIndex?: number
    ): ZIndexSubOrder;
    addEventListener(type: string, listener: TypedEventListener): void;

    //removeEventListener(type: string, listener: TypedEventListener): void ;

    //hasEventListener(type: string): boolean;

    clearEventListeners(): void;
    destroy(): void;
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): any[];
    getKeys(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    isEnabled(): boolean;
    axes: Record<ChartAxisDirection, ChartAxis | undefined>;
    visible: boolean;
    directions: ChartAxisDirection[];

    processData(dataController: DataController): Promise<void>;

    getTooltipHtml(seriesDatum: any): string;
    tooltip: ChartSeriesTooltip;

    canHaveAxes: boolean;
    nodeClickRange: InteractionRange;
    fireNodeClickEvent(event: Event, datum: any): void;
    hasEventListener(type: string): boolean;
    fireNodeDoubleClickEvent(event: Event, datum: any): void;
}
