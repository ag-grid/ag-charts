import type {
    AxisID,
    BaseStyleTypeMap,
    CanvasPoint,
    ChartAxisDirection,
    ChartUpdateType,
    DeepReadonly,
    DefinedZoomState,
    Scale,
    ZoomMinMax,
    ZoomMinMaxDirection,
    ZoomState,
} from 'ag-charts-core';
import { EventEmitter } from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgAnnotation,
    AgAutoScaledAxes,
    AgCartesianAxisPosition,
    AgContextMenuItemShowOn,
    AgNumericValue,
    AgScrollbarPlacement,
    AgStateGroupingValueType,
    AgStateValueType,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AgZoomEventSource,
} from 'ag-charts-types';

import type { CrossLineValuePick } from '../chart/crossline/crossLine';
import { DataSet } from '../chart/data/dataSet';
import type { ContextMenuRegionContexts, ContextShowOnMap } from '../chart/interaction/contextMenuTypes';
import type { ChartLegendType } from '../chart/legend/legendDatum';
import type { ISeries, SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { AxisValuePick } from '../module/axisContext';
import type { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
import type { SelectionInterface } from '../scene/selection';
import type { DragWidgetEvent, KeyboardWidgetEvent, MouseWidgetEvent, WheelWidgetEvent } from '../widget/widgetEvents';

export type EventsHub = EventEmitter<EventsHubMap>;

export interface UpdateCompleteEvent {
    readonly apiUpdate: boolean;
    readonly wasShortcut: boolean;
}

export interface PreSeriesUpdateEvent {
    readonly requiredRangeRatio: number;
    readonly requiredRangeDirection: ChartAxisDirection;
    readonly requiredRange: number;
}

export interface PreSceneRenderEvent {
    readonly apiUpdate: boolean;
}

export interface ProcessDataEvent {
    readonly series: { shouldFlipXY?: boolean };
}

export interface UpdateOpts {
    forceNodeDataRefresh?: boolean;
    skipAnimations?: boolean;
    newAnimationBatch?: boolean;
    seriesToUpdate?: Iterable<ISeries<any, any, any>>;
    backOffMs?: number;
    apiUpdate?: boolean;
    clearCallbackCache?: boolean;
}

export interface SeriesAreaHoverEvent extends Readonly<CanvasPoint> {
    readonly consumed: boolean;
    readonly sourceEvent: Event;
}

export interface SeriesAreaClickEvent {
    readonly type: 'click' | 'dblclick';
    readonly consumed: boolean;
    readonly sourceEvent: MouseEvent | TouchEvent | KeyboardEvent;
    readonly clickedNode: SeriesNodeDatum | undefined;
    /**
     * The scene-node under the pointer for `clickedNode`. Undefined for keyboard-synthesised
     * clicks (Enter/Space on a focused node), which have no pointer position to hit-test.
     */
    readonly target: Node<unknown> | undefined;
}

/**
 * A pointer click (or double-click) inside the series area, carrying canvas coordinates so that
 * modules owning content drawn over the series area can hit-test it and run their own listeners.
 * Mirrors the `series-area:contextmenu` handoff; keyboard-synthesised clicks are excluded because
 * they carry no pointer position.
 */
export interface SeriesAreaPointerClickEvent extends Readonly<CanvasPoint> {
    readonly type: 'click' | 'dblclick';
    readonly sourceEvent: Event;
}

export interface SeriesAreaContextMenuEvent extends Readonly<CanvasPoint> {
    readonly widgetEvent: MouseWidgetEvent<'contextmenu'>;
    /**
     * The overlapping axis, if any, at the pointer. Modules that own axes annotate this so the series-area
     * dispatch can offer the axis region alongside the series region rather than dispatching a competing menu.
     */
    axis?: AxisValuePick;
    /**
     * The cross line, if any, at the pointer. The cross-lines plugin annotates this (mirroring `axis`) so the
     * series-area dispatch can offer the cross-line region alongside the series region.
     */
    crossLine: CrossLineValuePick[];
}

export interface DataModelSeriesDiff {
    readonly changed: boolean;
    readonly added: Set<string>;
    readonly updated: Set<string>;
    readonly removed: Set<string>;
    readonly moved: Set<string>;
}

export type DataModelDiff = Record<string /* series-id */, DataModelSeriesDiff>;

export interface DataModelDiffEvent {
    readonly diff: DataModelDiff;
}

// Event name convention is 'module:event-name'
export interface EventsHubMap {
    'active:load-memento': ActiveLoadMementoEvent;
    'annotations:restore': AnnotationsRestoreEvent;
    'axis:change': null;
    'axis-dom-proxy:cursor': { cursor: BaseStyleTypeMap['cursor'] | undefined };
    'axis-dom-proxy:toggle-dragging-cursor': { direction: ChartAxisDirection; enabled: boolean };
    'axis-dom-proxy:drag-start': AxisDOMProxyDragEvent<'drag-start'>;
    'axis-dom-proxy:drag-move': AxisDOMProxyDragEvent<'drag-move'>;
    'axis-dom-proxy:drag-end': AxisDOMProxyDragEvent<'drag-end'>;
    'axis-dom-proxy:dblclick': AxisDOMProxyMouseEvent<'dblclick'>;
    'axis-dom-proxy:mouseenter': AxisDOMProxyMouseEnterEvent;
    'axis-dom-proxy:mouseleave': AxisDOMProxyMouseLeaveEvent;
    'axis-dom-proxy:update': AxisDOMProxyUpdateEvent;
    'axis-dom-proxy:wheel': AxisDOMProxyWheelEvent;
    'canvas:resize': { width: number; height: number };
    'chart:request-refresh': null;
    'chart:request-update': UpdateRequestEvent;
    'collapsed:restore': CollapsedRestoreEvent;
    'collapsed:change': null;
    'context-menu:setup': ContextMenuEvent;
    'context-menu:complete': ContextMenuEvent;
    'data:load': { data: unknown[]; requestId?: number };
    'data:error': { requestId?: number } | null;
    'data:render-verdict': { requestId?: number; rendered: boolean };
    'data:update': DataSet | undefined;
    'data:source-change': null;
    'datamodel:diff': DataModelDiffEvent;
    'dom:container-change': null;
    'dom:hidden': null;
    'dom:resize': null;
    'font:load': null;
    'highlight:change': HighlightChangeEvent;
    'highlight:selection-updated': HighlightSelectionUpdatedEvent;
    'layout:complete': LayoutCompleteEvent;
    'legend:item-hover': null;
    'legend:item-click': LegendItemClickEvent;
    'legend:item-double-click': LegendItemDoubleClickEvent;
    'locale:change': null;
    'rtl:change': null;
    'scrollbar:wheel': ScrollbarWheelEvent;
    'series:focus-change': null;
    'series:keynav-zoom': SeriesKeyNavZoomEvent;
    'series:keynav-panx': SeriesKeyNavPanXEvent;
    'series:keynav-expand': SeriesKeyNavExpandEvent;
    'series:keynav-collapse': SeriesKeyNavCollapseEvent;
    'series-area:hover': SeriesAreaHoverEvent;
    'series-area:click': SeriesAreaClickEvent;
    'series-area:pointer-click': SeriesAreaPointerClickEvent;
    'series-area:contextmenu': SeriesAreaContextMenuEvent;
    'series:redo': null;
    'series:undo': null;
    /** Emitted when resolved theme parameters change, i.e. the theme CSS variables have been rewritten. */
    'theme:params-change': null;
    'update:complete': UpdateCompleteEvent;
    'update:pre-dom': null;
    'update:pre-series': PreSeriesUpdateEvent;
    'update:pre-scene-render': PreSceneRenderEvent;
    'update:process-data': ProcessDataEvent;
    'zoom:save-memento': ZoomSaveMementoEvent;
    'zoom:load-memento': ZoomLoadMementoEvent;
    /**
     * `change-request` means that something has requested the `ZoomManager` to update the zoom state in some way. The
     * changes might be modified, constrained, rejected or ignored depending on what options/listeners are registered.
     */
    'zoom:change-request': ZoomChangeRequestEvent;
    /**
     * `change-complete` is dispatched when an effective `change-request` was processed, and the `ZoomManager`
     * internal state has been updated (but no redraw has occurred yet). `change-request` that are "no-op" (i.e. nothing
     * has changed) are not followed by a `change-complete`.
     */
    'zoom:change-complete': ZoomChangeCompleteEvent;
    'zoom:pan-start': ZoomPanStartEvent;
    'zoom-interaction:request-axis-wheel': ZoomInteractionRequestAxisWheelEvent;
    'zoom-interaction:scrollbar:wheel': ZoomInteractionWheelEvent;
    'zoom-interaction:zoom:wheel': ZoomInteractionWheelEvent;
    'zoom-interaction:scrollbar:scrollbar-wheel': ZoomInteractionWheelEvent;
    'zoom-interaction:zoom:scrollbar-wheel': ZoomInteractionWheelEvent;
    'zoom-interaction:scrollbar:axis-drag-start': ZoomInteractionAxisDragEvent<'drag-start'>;
    'zoom-interaction:zoom:axis-drag-start': ZoomInteractionAxisDragEvent<'drag-start'>;
    'zoom-interaction:scrollbar:axis-drag-move': ZoomInteractionAxisDragEvent<'drag-move'>;
    'zoom-interaction:zoom:axis-drag-move': ZoomInteractionAxisDragEvent<'drag-move'>;
    'zoom-interaction:scrollbar:axis-drag-end': ZoomInteractionAxisDragEvent<'drag-end'>;
    'zoom-interaction:zoom:axis-drag-end': ZoomInteractionAxisDragEvent<'drag-end'>;
    'zoom-interaction:scrollbar:axis-dblclick': ZoomInteractionAxisMouseEvent<'dblclick'>;
    'zoom-interaction:zoom:axis-dblclick': ZoomInteractionAxisMouseEvent<'dblclick'>;
    'zoom-interaction:scrollbar:axis-mouseenter': ZoomInteractionAxisMouseEvent<'mouseenter'>;
    'zoom-interaction:zoom:axis-mouseenter': ZoomInteractionAxisMouseEvent<'mouseenter'>;
    'zoom-interaction:scrollbar:axis-mouseleave': ZoomInteractionAxisMouseEvent<'mouseleave'>;
    'zoom-interaction:zoom:axis-mouseleave': ZoomInteractionAxisMouseEvent<'mouseleave'>;
    'zoom-interaction:scrollbar:axis-wheel': ZoomInteractionAxisWheelEvent;
    'zoom-interaction:zoom:axis-wheel': ZoomInteractionAxisWheelEvent;
}

export interface ActiveLoadMementoEvent {
    readonly initialState: boolean;
    readonly chartId: string;
    readonly activeItem: Readonly<AgActiveItemState> | undefined;
    reject(): void;
    setDatum(nodeDatum: SeriesNodeDatum | undefined): void;
}

interface AnnotationsRestoreEvent {
    annotations: AgAnnotation[];
}

export interface AxisDOMProxyDragEvent<T extends 'drag-start' | 'drag-move' | 'drag-end'> {
    axisId: AxisID;
    direction: ChartAxisDirection;
    event: DragWidgetEvent<T>;
}

export interface AxisDOMProxyMouseEvent<T extends 'dblclick'> {
    axisId: AxisID;
    direction: ChartAxisDirection;
    event: MouseWidgetEvent<T> | SeriesAreaClickEvent;
}

export interface AxisDOMProxyMouseEnterEvent {
    axisId: AxisID;
    direction: ChartAxisDirection;
    event: MouseWidgetEvent<'mouseenter'> | SeriesAreaHoverEvent;
}

export interface AxisDOMProxyMouseLeaveEvent {
    event: MouseWidgetEvent<'mouseleave'> | SeriesAreaHoverEvent;
}

export interface AxisDOMProxyWheelEvent {
    axisId: AxisID;
    direction: ChartAxisDirection;
    event: WheelWidgetEvent;
}

export interface AxisDOMProxyUpdateEvent {
    source: string;
    enabled: boolean;
    enableDoubleClick: boolean;
    enableDragging: boolean;
    enableScrolling: boolean;
    enableContextMenu: boolean;
}

export type ContextMenuEvent<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> = Readonly<CanvasPoint> & {
    /** The primary region of this event, for backwards compatibility; `regions` holds the full set. */
    readonly showOn: K;
    readonly context: Readonly<ContextShowOnMap[K]['context']>;
    readonly widgetEvent: MouseWidgetEvent<'contextmenu'> & { sourceEvent: Partial<Pick<PointerEvent, 'pointerType'>> };
    /** Every region under the pointer (excluding the implicit `always`). Contains more than one entry where regions overlap. */
    readonly regions: readonly AgContextMenuItemShowOn[];
    /** Per-region pick contexts, keyed by region; `context` mirrors the primary region's entry. */
    readonly contexts: Readonly<ContextMenuRegionContexts>;
};

export interface HighlightChangeEvent {
    readonly callerId: string;
    readonly currentHighlight?: HighlightNodeDatum;
    readonly previousHighlight?: HighlightNodeDatum;
    /** Part of the highlighted node under the pointer, for series that distinguish parts (`Series.getHighlightPart`). */
    readonly currentHighlightPart?: string;
    readonly previousHighlightPart?: string;
    readonly highlightSuppressed: boolean;
    readonly highlightInViewport: boolean;
}

export interface HighlightSelectionUpdatedEvent {
    readonly highlightSelection: SelectionInterface<unknown, Node<unknown>>;
}

export interface LayoutCompleteEvent {
    readonly chart: Readonly<{ width: number; height: number }>;
    readonly series: Readonly<{ rect: BBox; paddedRect: BBox; visible: boolean }>;
    readonly clipSeries: boolean;
    readonly axes: Readonly<Record<string, AxisLayout>>;
    readonly layoutBox: Readonly<BBox>;
}

export interface LegendItemClickEvent {
    readonly legendType: ChartLegendType;
    readonly enabled: boolean;
    readonly series: any;
    readonly itemId: number | string | undefined;
    readonly legendItemName?: string;
}

export interface LegendItemDoubleClickEvent {
    readonly legendType: ChartLegendType;
    readonly enabled: boolean;
    readonly series: any;
    readonly itemId: number | string | undefined;
    readonly legendItemName?: string;
    readonly numVisibleItems: number;
}

export interface ScrollbarWheelEvent {
    readonly event: WheelWidgetEvent;
    readonly orientation: 'horizontal' | 'vertical';
}

export interface SeriesKeyNavZoomEvent {
    readonly delta: -1 | 0 | 1;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface SeriesKeyNavPanXEvent {
    readonly delta: 'home' | 'end' | -1 | 1;
    readonly reverse: boolean;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface SeriesKeyNavExpandEvent {
    readonly nodeDatum: SeriesNodeDatum;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface SeriesKeyNavCollapseEvent {
    readonly nodeDatum: SeriesNodeDatum;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export type ZoomMemento = {
    rangeX?: ZoomMementoRange;
    rangeY?: ZoomMementoRange;
    ratioX?: ZoomMementoRatio;
    ratioY?: ZoomMementoRatio;
    autoScaledAxes?: AgAutoScaledAxes;
};

export interface ZoomMementoRange {
    start?: AgStateValueType | AgStateGroupingValueType;
    end?: AgStateValueType | AgStateGroupingValueType;
}

export interface ZoomMementoRatio {
    start?: number;
    end?: number;
}

export interface ZoomSaveMementoEvent {
    // Note: `memento` is intentionally mutable. At the time of writing, only one feature (autoScaling) writes to the
    // memento state.
    memento: ZoomMemento;
}

export interface ZoomLoadMementoEvent {
    // Note: `zoom` is intentionally mutable. At the time of writing, only one feature (autoScaling) depends on zoom
    // memento events, so it's safe because we do not have multiple writers. We may need to consider adding a
    // `constrain()` method to this event.
    zoom: DefinedZoomState;
    readonly memento: DeepReadonly<ZoomMemento> | undefined;
    readonly navigatorModule: boolean;
    readonly zoomModule: boolean;
}

export type ZoomChangeState = {
    readonly [K in AxisID]: Readonly<ZoomMinMaxDirection> | undefined;
};

export type ZoomEventSourceDetail =
    | `contextmenu-pan-to-cursor`
    | `contextmenu-reset`
    | `contextmenu-zoom-to-cursor`
    | `dataSource`
    | `internal-applyOptions`
    | `internal-autoScaling`
    | `internal-networkSeriesFocusChange`
    | `internal-panToBBox`
    | `internal-prepareResizedChart`
    | `internal-restoreMemento`
    | `internal-requiredWidth`
    | `internal-setAxes`
    | `internal-updateSyncZoom`
    | `keyboard(${-1 | 0 | 1})`
    | `keyboard-page(${'home' | 'end' | -1 | 1})`
    | `navigatorDOM`
    | `navigator`
    | `onDataChange-reset`
    | `unspecified` // FIXME(AG-16412): remove this
    | `zoom-axis-dblclick`
    | `zoom-axis-drag`
    | `zoom-axis-wheel`
    | `zoom-button-pan-end`
    | `zoom-button-pan-left`
    | `zoom-button-pan-right`
    | `zoom-button-pan-start`
    | `zoom-button-reset`
    | `zoom-button-zoom-in`
    | `zoom-button-zoom-out`
    | `zoom-range-button-${number}`
    | `zoom-seriesarea-dblclick`
    | `zoom-seriesarea-panner`
    | `zoom-seriesarea-selector`
    | `zoom-seriesarea-twofingers`
    | `zoom-seriesarea-wheel`
    | `scrollbar`;

export interface ZoomChangeRequestEvent {
    readonly source: AgZoomEventSource;
    readonly sourceDetail: ZoomEventSourceDetail;
    readonly isReset: boolean;
    readonly changedAxes: readonly AxisID[];
    readonly state: ZoomChangeState;
    readonly oldState: ZoomChangeState;
    readonly x?: Readonly<ZoomMinMax>;
    readonly y?: Readonly<ZoomMinMax>;
    stateAsDefinedZoom(): DefinedZoomState; // do not use (legacy zoom-state)
    constrainZoom(zoom: ZoomState): void; // do not use (legacy zoom-state)
    constrainChanges(changes: ZoomChangeState): void;
}

export interface ZoomChangeCompleteEvent {
    readonly source: AgZoomEventSource;
    readonly sourceDetail: ZoomEventSourceDetail;
    readonly x?: Readonly<ZoomMinMax>;
}

export interface ZoomPanStartEvent {
    readonly callerId: string;
}

export interface ZoomInteractionRequestAxisWheelEvent {
    readonly event: WheelWidgetEvent;
    readonly direction: ChartAxisDirection;
}

export interface ZoomInteractionWheelEvent {
    readonly event: WheelWidgetEvent;
    readonly stopProcessing: () => void;
    readonly abort: () => void;
    readonly capped: () => void;
    readonly uncapped: () => void;
}

export interface ZoomInteractionAxisDragEvent<T extends 'drag-start' | 'drag-move' | 'drag-end'> {
    readonly event: DragWidgetEvent<T>;
    readonly axisId: AxisID;
    readonly direction: ChartAxisDirection;
    readonly stopProcessing: () => void;
}

export interface ZoomInteractionAxisMouseEvent<T extends 'dblclick' | 'mouseenter' | 'mouseleave'> {
    readonly event: MouseWidgetEvent<T> | SeriesAreaHoverEvent;
    readonly axisId: AxisID;
    readonly direction: ChartAxisDirection;
    readonly stopProcessing: () => void;
}

export interface ZoomInteractionAxisWheelEvent extends ZoomInteractionWheelEvent {
    direction: ChartAxisDirection;
}

export interface UpdateRequestEvent {
    readonly type?: ChartUpdateType;
    readonly opts?: UpdateOpts;
}

export interface HighlightNodeDatum extends SeriesNodeDatum {
    readonly xKey?: string;
    readonly yKey?: string;
    readonly angleKey?: string;
    readonly radiusKey?: string;
    readonly colorValue?: number;
    readonly cumulativeValue?: number;
    readonly aggregatedValue?: AgNumericValue;
    readonly legendItemName?: string;
}

export interface AxisLayout {
    id: string;
    rect: BBox;
    translation: { x: number; y: number };
    /** Offset applied by `crossAt`, already included in `translation`. Zero for an axis at its `position` edge. */
    crossAxisTranslation?: { x: number; y: number };
    position?: AgCartesianAxisPosition;
    gridPadding: number;
    seriesAreaPadding: number;
    tickSize: number;
    labelThickness?: number;
    scrollbar?: {
        enabled: boolean;
        placement: AgScrollbarPlacement;
        spacing: number;
        thickness: number;
        offset: number;
    };
    label: {
        fractionDigits: number;
        spacing: number;
        format?: string | Record<string, string>;
    };
    direction: ChartAxisDirection;
    domain: any[];
    scale: Scale<any, any, number | AgTimeInterval | AgTimeIntervalUnit>;
}

export interface CollapsedRestoreEvent {
    collapsed?: (string | number)[];
}
