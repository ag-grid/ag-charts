import type {
    AxisID,
    ChartAxisDirection,
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
    AgScrollbarPlacement,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AgZoomEventSource,
    AgZoomRange,
    AgZoomRatio,
} from 'ag-charts-types';

import { DataSet } from '../chart/data/dataSet';
import type { ContextShowOnMap } from '../chart/interaction/contextMenuTypes';
import type { CategoryLegendDatum, ChartLegendType } from '../chart/legend/legendDatum';
import type { DatumIndexType, SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { BBox } from '../scene/bbox';
import type { KeyboardWidgetEvent, MouseWidgetEvent } from '../widget/widgetEvents';

export type EventsHub = EventEmitter<EventsHubMap>;

export interface SeriesAreaHoverEvent {
    readonly canvasX: number;
    readonly canvasY: number;
    readonly consumed: boolean;
    readonly sourceEvent: Event;
}

export interface SeriesAreaClickEvent {
    readonly canvasX: number;
    readonly canvasY: number;
    readonly consumed: boolean;
    readonly sourceEvent: Event;
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
    'active:update': AgActiveItemState | undefined;
    'annotations:restore': AnnotationsRestoreEvent;
    'axis:hover': AxisHoverEvent;
    'axis:change': null;
    'context-menu:setup': ContextMenuEvent;
    'context-menu:complete': ContextMenuEvent;
    'data:load': { data: unknown[] };
    'data:error': null;
    'data:update': DataSet | undefined;
    'data:source-change': null;
    'datamodel:diff': DataModelDiffEvent;
    'dom:container-change': null;
    'dom:hidden': null;
    'dom:resize': null;
    'highlight:change': HighlightChangeEvent;
    'layout:complete': LayoutCompleteEvent;
    'legend:change': LegendChangeEvent;
    'legend:change-partial': LegendChangePartialEvent;
    'legend:item-click': LegendItemClickEvent;
    'legend:item-double-click': LegendItemDoubleClickEvent;
    'locale:change': null;
    'series:focus-change': null;
    'series:keynav-zoom': SeriesKeyNavZoomEvent;
    'series-area:hover': SeriesAreaHoverEvent;
    'series-area:click': SeriesAreaClickEvent;
    'series:redo': null;
    'series:undo': null;
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
}

export interface ActiveLoadMementoEvent {
    readonly activeItem: Readonly<AgActiveItemState> | undefined;
    reject(): void;
    setDatum(nodeDatum: SeriesNodeDatum<DatumIndexType> | undefined): void;
}

interface AnnotationsRestoreEvent {
    annotations: AgAnnotation[];
}

export interface AxisHoverEvent {
    readonly axisId: string;
    readonly direction: ChartAxisDirection;
}

export type ContextMenuEvent<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> = {
    readonly showOn: K;
    readonly x: number;
    readonly y: number;
    readonly context: Readonly<ContextShowOnMap[K]['context']>;
    readonly widgetEvent: MouseWidgetEvent<'contextmenu'> & { sourceEvent: Partial<Pick<PointerEvent, 'pointerType'>> };
};

export interface HighlightChangeEvent {
    readonly callerId: string;
    readonly currentHighlight?: HighlightNodeDatum;
    readonly previousHighlight?: HighlightNodeDatum;
}

export interface LayoutCompleteEvent {
    readonly chart: Readonly<{ width: number; height: number }>;
    readonly series: Readonly<{ rect: BBox; paddedRect: BBox; visible: boolean }>;
    readonly clipSeries: boolean;
    readonly axes: Readonly<Record<string, AxisLayout>>;
}

export interface LegendChangeEvent {
    legendData?: CategoryLegendDatum[];
}

export interface LegendChangePartialEvent {
    seriesId: string;
    legendData: CategoryLegendDatum[];
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

export interface SeriesKeyNavZoomEvent {
    readonly delta: -1 | 0 | 1;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export type ZoomMemento = {
    rangeX?: AgZoomRange;
    rangeY?: AgZoomRange;
    ratioX?: AgZoomRatio;
    ratioY?: AgZoomRatio;
    autoScaledAxes?: AgAutoScaledAxes;
};

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
    | `internal-panToBBox`
    | `internal-prepareResizedChart`
    | `internal-restoreMemento`
    | `internal-requiredWidth`
    | `internal-setAxes`
    | `internal-updateSyncZoom`
    | `keyboard(${-1 | 0 | 1})`
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

export interface HighlightNodeDatum<I extends DatumIndexType = DatumIndexType> extends SeriesNodeDatum<I> {
    readonly xKey?: string;
    readonly yKey?: string;
    readonly angleKey?: string;
    readonly radiusKey?: string;
    readonly colorValue?: number;
    readonly cumulativeValue?: number;
    readonly aggregatedValue?: number;
    readonly domain?: [number, number];
    readonly legendItemName?: string;
}

export interface AxisLayout {
    id: string;
    rect: BBox;
    translation: { x: number; y: number };
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
