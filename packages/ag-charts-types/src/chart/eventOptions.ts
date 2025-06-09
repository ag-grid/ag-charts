import type { AgAnnotation } from './annotationsOptions';
import type { Listener } from './callbackOptions';
import type { Ratio, TContextDefault, TDatumDefault } from './types';
import type { AgAutoScaledAxes } from './zoomOptions';

interface AgChartEvent<T extends string, TContext = TContextDefault> {
    type: T;
    event: Event;
    /** Callback context for this event. */
    context?: TContext;
}

export interface AgPreventableEvent {
    /** Prevent the AG Charts built-in default event handlers from running. */
    preventDefault(): void;
}

export interface AgNodeClickEvent<TEvent extends string, TDatum, TContext = TContextDefault>
    extends AgChartEvent<TEvent, TContext> {
    /** Event type. */
    type: TEvent;
    /** Series ID, as specified in `series.id` (or generated if not specified) */
    seriesId: string;
    /** Datum from the chart or series data array. */
    datum: TDatum;
    /** xKey as specified on series options */
    xKey?: TDatum extends object ? keyof TDatum & string : string;
    /** yKey as specified on series options */
    yKey?: TDatum extends object ? keyof TDatum & string : string;
    /** sizeKey as specified on series options */
    sizeKey?: TDatum extends object ? keyof TDatum & string : string;
    /** labelKey as specified on series options */
    labelKey?: TDatum extends object ? keyof TDatum & string : string;
    /** colorKey as specified on series options */
    colorKey?: TDatum extends object ? keyof TDatum & string : string;
    /** angleKey as specified on series options */
    angleKey?: TDatum extends object ? keyof TDatum & string : string;
    /** calloutLabelKey as specified on series options */
    calloutLabelKey?: TDatum extends object ? keyof TDatum & string : string;
    /** sectorLabelKey as specified on series options */
    sectorLabelKey?: TDatum extends object ? keyof TDatum & string : string;
    /** radiusKey as specified on series options */
    radiusKey?: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgSeriesVisibilityChange<TContext = TContextDefault> {
    /** Event type. */
    type: 'seriesVisibilityChange';
    /** Callback context for this event. */
    context?: TContext;
    /** Series id */
    seriesId: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId?: string | number;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
    /** The new visibility status that the series is changing to. */
    visible: boolean;
}

export interface AgAnnotationsEvent<TContext = TContextDefault> {
    type: 'annotations';
    annotations?: AgAnnotation[];
    context?: TContext;
}

export interface AgZoomEvent<TContext = TContextDefault> {
    type: 'zoom';
    rangeX?: AgZoomEventRange;
    rangeY?: AgZoomEventRange;
    ratioX: AgZoomEventRatio;
    ratioY: AgZoomEventRatio;
    autoScaledAxes?: AgAutoScaledAxes;
    context?: TContext;
}

export interface AgZoomEventRange {
    start?: Date | string | number;
    end?: Date | string | number;
}

export interface AgZoomEventRatio {
    start: Ratio;
    end: Ratio;
}

export type AgChartClickEvent<TContext = TContextDefault> = AgChartEvent<'click', TContext>;
export type AgChartDoubleClickEvent<TContext = TContextDefault> = AgChartEvent<'doubleClick', TContext>;
export type AgChartContextMenuEvent<TContext = TContextDefault> = AgChartEvent<'contextMenuEvent', TContext>;
export type AgSeriesAreaContextMenuActionEvent<TContext = TContextDefault> = AgChartEvent<
    'seriesContextMenuAction',
    TContext
>;
export type AgNodeContextMenuActionEvent<TDatum = TDatumDefault, TContext = TContextDefault> = AgNodeClickEvent<
    'nodeContextMenuAction',
    TDatum,
    TContext
>;

export interface AgBaseChartListeners<TDatum, TContext = TContextDefault> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is clicked.
     *  Useful for a chart containing multiple series.
     */
    seriesNodeClick?: Listener<AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>>;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is double-clicked.
     * Useful for a chart containing multiple series.*/
    seriesNodeDoubleClick?: Listener<AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>>;
    /** The listener to call when a series visibility is changed. */
    seriesVisibilityChange?: Listener<AgSeriesVisibilityChange<TContext>>;
    /** The listener to call when the chart is clicked. */
    click?: Listener<AgChartClickEvent<TContext>>;
    /** The listener to call when the chart is double-clicked. */
    doubleClick?: Listener<AgChartDoubleClickEvent<TContext>>;
    /** The listener to call when the annotations are changed. */
    annotations?: Listener<AgAnnotationsEvent<TContext>>;
    /** The listener to call when the zoom is changed. */
    zoom?: Listener<AgZoomEvent<TContext>>;
}

export interface AgSeriesListeners<TDatum, TContext = TContextDefault> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is clicked. */
    seriesNodeClick?: Listener<AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>>;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is double-clicked. */
    seriesNodeDoubleClick?: Listener<AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>>;
}
