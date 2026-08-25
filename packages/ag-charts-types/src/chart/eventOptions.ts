import type { AgActiveState } from '../api/activeState';
import type { AgStateGroupingValueType, AgStateValueType } from '../api/stateTypes';
import type { TextOrSegments } from '../series/cartesian/commonOptions';
import type { AgAnnotation } from './annotationsOptions';
import type { AgAxisCoordinate, AgAxisDirection, AgAxisValue } from './axisOptions';
import type { AgItemType, Listener, SelectionState } from './callbackOptions';
import type { AgNumericValue } from './dataValues';
import type { ContextDefault, DatumDefault, Ratio, ResolvedDatumKey } from './types';
import type { AgAutoScaledAxes } from './zoomOptions';

interface AgChartEvent<T extends string, TContext = ContextDefault> {
    type: T;
    event: Event;
    /** Callback context for this event. */
    context?: TContext;
}

export interface AgPreventableEvent {
    /** True if the `preventDefault()` method has been called on this event. */
    readonly defaultPrevented: boolean;
    /** Prevent the AG Charts built-in default event handlers from running. */
    preventDefault(): void;
}

interface AgCoordinatedEvent {
    /** Domain-space coordinates of this event. */
    coordinates?: AgCoordinates;
}

export interface AgBaseNodeClickEvent<TEvent extends string, TDatum, TContext = ContextDefault>
    extends AgChartEvent<TEvent, TContext>, AgPreventableEvent, AgCoordinatedEvent, AgNodeParams<TDatum> {
    /** Event type. */
    type: TEvent;
}

export interface AgNodeClickEvent<
    TEvent extends string,
    TDatum,
    TContext = ContextDefault,
> extends AgBaseNodeClickEvent<TEvent, TDatum, TContext> {
    /** TODO: writeme */
    allClickParams: AgNodeClickParams<TDatum>[];
}

/**
 * Everything a node event reports about the picked datum itself, i.e. an {@link AgNodeClickEvent} minus the
 * event-delivery fields. Most fields are optional, because each series type only sets the properties applicable to it.
 */
export interface AgNodeParams<TDatum> {
    /** Series ID, as specified in `series.id` (or generated if not specified) */
    seriesId: string;
    /** The unique identifier of the picked datum. */
    itemId: string | number;
    /** The data ID key, if set on chart options. When present, `itemId` is a stable identifier. */
    dataIdKey?: ResolvedDatumKey<TDatum>;
    /** Datum from the chart or series data array. */
    datum: TDatum;
    /** Every datum grouped into the bin for histogram series; `undefined` for all other series. */
    datums?: TDatum[];
    /** Waterfall series only: the type of bar - `positive`, `negative`, `total` or `subtotal`. */
    itemType?: AgItemType;
    /** Waterfall series only: the computed cumulative value for `total` and `subtotal` bars. */
    totalValue?: AgNumericValue;
    /** The current selection state of this datum. Set to `undefined` if the selection module is not enabled. */
    selectionState?: SelectionState;
    /** Whether the clicked item is collapsed. */
    isCollapsed?: boolean;
    /** xKey as specified on series options */
    xKey?: ResolvedDatumKey<TDatum>;
    /** yKey as specified on series options */
    yKey?: ResolvedDatumKey<TDatum>;
    /** sizeKey as specified on series options */
    sizeKey?: ResolvedDatumKey<TDatum>;
    /** labelKey as specified on series options */
    labelKey?: ResolvedDatumKey<TDatum>;
    /** colorKey as specified on series options */
    colorKey?: ResolvedDatumKey<TDatum>;
    /** angleKey as specified on series options */
    angleKey?: ResolvedDatumKey<TDatum>;
    /** calloutLabelKey as specified on series options */
    calloutLabelKey?: ResolvedDatumKey<TDatum>;
    /** sectorLabelKey as specified on series options */
    sectorLabelKey?: ResolvedDatumKey<TDatum>;
    /** radiusKey as specified on series options */
    radiusKey?: ResolvedDatumKey<TDatum>;
    /** Histogram series only: zero-based positional index of the bin within the series. */
    binIndex?: number;
    /** Histogram series only: the bin's start and end bounds on the x-axis. */
    binRange?: [AgNumericValue, AgNumericValue];
    /** Histogram series only: the aggregated `yKey` value for the bin. */
    aggregatedValue?: AgNumericValue;
    /** Histogram series only: the number of source rows within the bin. */
    frequency?: number;
}

export interface AgSeriesVisibilityChange<TContext = ContextDefault> {
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

export type AgActiveChangeEventSource = 'state-change' | 'user-interaction';

export interface AgActiveChangeEvent<TDatum, TContext> extends AgActiveState, AgPreventableEvent {
    /** Event type. */
    type: 'activeChange';
    /** An indication of what triggered this event. */
    source: AgActiveChangeEventSource;
    /** Callback context for this event. */
    context?: TContext;
    /** Datum from the chart or series data array. */
    datum?: TDatum;
    /** Every datum grouped into the bin for histogram series; `undefined` for all other series. */
    datums?: TDatum[];
    /** The active item's type, for series that distinguish item types (e.g. waterfall, OHLC, candlestick, range area); `undefined` otherwise. */
    itemType?: AgItemType;
    /** Waterfall series only: the computed cumulative value for `total` and `subtotal` bars. */
    totalValue?: AgNumericValue;
    /** The data ID key, if set on chart options. When present, `activeItem.itemId` is a stable identifier. */
    dataIdKey?: ResolvedDatumKey<TDatum>;
}

export interface AgSelectionItemIds {
    /** Series ID, as specified in `series.id` (or generated if not specified). */
    seriesId: string;
    /** The unique identifier of the datum as specified in `dataIdKey` if set (or generated if not specified). */
    itemId: string | number;
}

export interface AgSelectionItem<TDatum> extends AgSelectionItemIds {
    /** Datum from the chart or series data array. */
    datum: TDatum;
}

export type AgSelectionChangeEventSource = 'user-interaction' | 'api-call';

export interface AgSelectionChangeEvent<TDatum, TContext> extends AgPreventableEvent {
    /** Event type. */
    type: 'selectionChange';
    /** An indication of what triggered this event. */
    source: AgSelectionChangeEventSource;
    /** Callback context for this event. */
    context?: TContext;
    /** Items added to the selection in this change. */
    added: AgSelectionItem<TDatum>[];
    /** Items removed from the selection in this change. */
    removed: AgSelectionItem<TDatum>[];
}

export interface AgCollapsedChangeItem<TDatum> {
    /** The unique identifier of the datum as specified in `dataIdKey` if set (or generated if not specified). */
    itemId: string | number;
    /** Datum from the chart or series data array. */
    datum: TDatum;
}

export type AgCollapsedChangeEventSource = 'user-interaction' | 'api-call';

export interface AgCollapsedChangeEvent<TDatum, TContext> extends AgPreventableEvent {
    /** Event type. */
    type: 'collapsedChange';
    /** An indication of what triggered this event. */
    source: AgCollapsedChangeEventSource;
    /** Callback context for this event. */
    context?: TContext;
    /** Items that will be newly collapsed after this change. */
    collapsed: AgCollapsedChangeItem<TDatum>[];
    /** Items that will be newly expanded after this change. */
    expanded: AgCollapsedChangeItem<TDatum>[];
}

export interface AgAnnotationsEvent<TContext = ContextDefault> {
    type: 'annotations';
    annotations?: AgAnnotation[];
    context?: TContext;
}

export type AgZoomEventSource =
    | 'chart-update'
    | 'data-update'
    | 'range-check'
    | 'state-change'
    | 'sync'
    | 'user-interaction';

export interface AgZoomEvent<TContext = ContextDefault> {
    type: 'zoom';
    source: AgZoomEventSource;
    rangeX?: AgZoomEventRange;
    rangeY?: AgZoomEventRange;
    ratioX: AgZoomEventRatio;
    ratioY: AgZoomEventRatio;
    autoScaledAxes?: AgAutoScaledAxes;
    context?: TContext;
}

export interface AgZoomEventRange {
    start?: AgStateValueType | AgStateGroupingValueType;
    end?: AgStateValueType | AgStateGroupingValueType;
}

export interface AgZoomEventRatio {
    start: Ratio;
    end: Ratio;
}

export type AgCoordinates = Record<string, AgAxisCoordinate | undefined> & {
    x?: AgAxisCoordinate;
    y?: AgAxisCoordinate;
    angle?: AgAxisCoordinate;
    radius?: AgAxisCoordinate;
};

export interface AgChartClickEvent<TContext = ContextDefault>
    extends AgChartEvent<'click', TContext>, Partial<AgCoordinatedEvent> {}

export interface AgChartDoubleClickEvent<TContext = ContextDefault>
    extends AgChartEvent<'doubleClick', TContext>, Partial<AgCoordinatedEvent> {}

export interface AgChartContextMenuEvent<TContext = ContextDefault>
    extends AgChartEvent<'contextMenuEvent', TContext>, Partial<AgCoordinatedEvent> {}

export interface AgSeriesAreaContextMenuActionEvent<TContext = ContextDefault>
    extends AgChartEvent<'seriesContextMenuAction', TContext>, AgCoordinatedEvent {}

export type AgCaptionType = 'title' | 'subtitle' | 'footnote';

export interface AgAxisContextMenuActionEvent<TContext = ContextDefault>
    extends AgChartEvent<'axisContextMenuAction', TContext>, AgAxisCoordinate {
    /** Axis ID, as specified in `axes`. */
    axisId: string;
}

export interface AgAxisClickEvent<TEvent extends string, TContext = ContextDefault>
    extends AgChartEvent<TEvent, TContext>, AgAxisCoordinate {
    /** Axis ID, as specified in `axes` (generated if not specified). */
    axisId: string;
}

/** Axis listeners. Cross Line listeners are Cartesian charts only. */
export interface AgAxisListeners<TContext = ContextDefault> {
    /** The listener to call when the axis is clicked. */
    click?: Listener<AgAxisClickEvent<'click', TContext>>;
    /** The listener to call when the axis is double-clicked. */
    doubleClick?: Listener<AgAxisClickEvent<'doubleClick', TContext>>;
    /** The listener to call when a Cross Line on this axis is clicked. */
    crossLineClick?: Listener<AgCrossLineClickEvent<TContext>>;
    /** The listener to call when a Cross Line on this axis is double-clicked. */
    crossLineDoubleClick?: Listener<AgCrossLineDoubleClickEvent<TContext>>;
}

/** Identifies the Cross Line an event refers to, along with the axis that owns it. */
export interface AgCrossLineEvent<TEvent extends string, TContext = ContextDefault> extends AgChartEvent<
    TEvent,
    TContext
> {
    /** Cross Line ID (generated if not specified). */
    crossLineId: string;
    /** ID of the axis the Cross Line belongs to, as specified in `axes`. */
    axisId: string;
    /** Direction of the axis the Cross Line belongs to. */
    direction: AgAxisDirection;
    /** Whether the Cross Line is a single `line` or a `range` band. */
    crossLineType: 'line' | 'range';
    /** The data value of a `line` Cross Line. Undefined for `range` Cross Lines. */
    value?: AgAxisValue;
    /** The `[start, end]` data values of a `range` Cross Line. Undefined for `line` Cross Lines. */
    range?: [AgAxisValue, AgAxisValue];
}

export interface AgCrossLineContextMenuActionEvent<TContext = ContextDefault>
    extends AgCrossLineEvent<'crossLineContextMenuAction', TContext>, AgCoordinatedEvent {}

export interface AgCrossLineClickEvent<TContext = ContextDefault> extends AgCrossLineEvent<
    'crossLineClick',
    TContext
> {}

export interface AgCrossLineDoubleClickEvent<TContext = ContextDefault> extends AgCrossLineEvent<
    'crossLineDoubleClick',
    TContext
> {}

export interface AgCaptionContextMenuActionEvent<TContext = ContextDefault> extends AgChartEvent<
    'captionContextMenuAction',
    TContext
> {
    /** Which type of caption was clicked on. */
    captionType: AgCaptionType;
    /** The text of the clicked caption. */
    text: TextOrSegments;
}

export interface AgCaptionClickEvent<TEvent extends string, TContext = ContextDefault> extends AgChartEvent<
    TEvent,
    TContext
> {
    /** Which caption was clicked. Captions have no user-supplied id, so this is their identifier. */
    captionType: AgCaptionType;
    /** The text of the clicked caption. */
    text: TextOrSegments;
}

export interface AgCaptionListeners<TContext = ContextDefault> {
    /** The listener to call when the caption is clicked. */
    click?: Listener<AgCaptionClickEvent<'click', TContext>>;
    /** The listener to call when the caption is double-clicked. */
    doubleClick?: Listener<AgCaptionClickEvent<'doubleClick', TContext>>;
}

export interface AgNodeContextMenuActionEvent<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgNodeClickEvent<'nodeContextMenuAction', TDatum, TContext> {}

export interface AgBaseChartListeners<TDatum, TContext = ContextDefault> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is clicked.
     *  Useful for a chart containing multiple series.
     */
    seriesNodeClick?: Listener<AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>>;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is double-clicked.
     * Useful for a chart containing multiple series.*/
    seriesNodeDoubleClick?: Listener<AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>>;
    /** The listener to call when any axis in the chart is clicked.
     *  Useful for a chart containing multiple axes.
     */
    axisClick?: Listener<AgAxisClickEvent<'axisClick', TContext>>;
    /** The listener to call when any axis in the chart is double-clicked.
     *  Useful for a chart containing multiple axes.
     */
    axisDoubleClick?: Listener<AgAxisClickEvent<'axisDoubleClick', TContext>>;
    /** The listener to call when any caption (title, subtitle or footnote) in the chart is clicked. */
    captionClick?: Listener<AgCaptionClickEvent<'captionClick', TContext>>;
    /** The listener to call when any caption (title, subtitle or footnote) in the chart is double-clicked. */
    captionDoubleClick?: Listener<AgCaptionClickEvent<'captionDoubleClick', TContext>>;
    /** The listener to call when a series visibility is changed. */
    seriesVisibilityChange?: Listener<AgSeriesVisibilityChange<TContext>>;
    /** The listener to call when the active state (highlight/tooltip) is changed. */
    activeChange?: Listener<AgActiveChangeEvent<TDatum, TContext>>;
    /** The listener to call when data selection is changed */
    selectionChange?: Listener<AgSelectionChangeEvent<TDatum, TContext>>;
    /** The listener to call when collapsed items are changed. */
    collapsedChange?: Listener<AgCollapsedChangeEvent<TDatum, TContext>>;
    /** The listener to call when the chart is clicked. */
    click?: Listener<AgChartClickEvent<TContext>>;
    /** The listener to call when the chart is double-clicked. */
    doubleClick?: Listener<AgChartDoubleClickEvent<TContext>>;
    /** The listener to call when a Cross Line on any axis is clicked. */
    crossLineClick?: Listener<AgCrossLineClickEvent<TContext>>;
    /** The listener to call when a Cross Line on any axis is double-clicked. */
    crossLineDoubleClick?: Listener<AgCrossLineDoubleClickEvent<TContext>>;
    /** The listener to call when the annotations are changed. */
    annotations?: Listener<AgAnnotationsEvent<TContext>>;
    /** The listener to call when the zoom is changed. */
    zoom?: Listener<AgZoomEvent<TContext>>;
}

export interface AgSeriesListeners<TDatum, TContext = ContextDefault> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is clicked. */
    seriesNodeClick?: Listener<AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>>;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is double-clicked. */
    seriesNodeDoubleClick?: Listener<AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>>;
}
