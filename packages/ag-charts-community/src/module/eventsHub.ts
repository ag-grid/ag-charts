import { EventEmitter } from 'ag-charts-core';
import type { AgAnnotation, AgContextMenuItemShowOn } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { ContextShowOnMap } from '../chart/interaction/contextMenuTypes';
import type { HighlightNodeDatum } from '../chart/interaction/highlightManager';
import type { AxisZoomState, ZoomState } from '../chart/interaction/zoomManager';
import type { CategoryLegendDatum, ChartLegendType } from '../chart/legend/legendDatum';
import type { KeyboardWidgetEvent, MouseWidgetEvent } from '../widget/widgetEvents';

export type EventsHub = EventEmitter<EventsHubMap>;

// Event name convention is 'module:event-name'
export interface EventsHubMap {
    'annotations:restore': AnnotationsRestoreEvent;
    'axis:hover': AxisHoverEvent;
    'context-menu:setup': ContextMenuEvent;
    'context-menu:complete': ContextMenuEvent;
    'dom:container-changed': null;
    'dom:hidden': null;
    'dom:resize': null;
    'highlight:change': HighlightChangeEvent;
    'legend:change': LegendChangeEvent;
    'legend:item-click': LegendItemClickEvent;
    'legend:item-double-click': LegendItemDoubleClickEvent;
    'series:focus-change': null;
    'series:keynav-zoom': SeriesKeyNavZoomEvent;
    'series:redo': null;
    'series:undo': null;
    'zoom:change': ZoomChangeEvent;
    'zoom:pan-start': ZoomPanStartEvent;
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

export interface LegendChangeEvent {
    legendData?: CategoryLegendDatum[];
}

export interface LegendItemClickEvent {
    readonly legendType: ChartLegendType;
    readonly enabled: boolean;
    readonly series: any;
    readonly itemId: any;
    readonly legendItemName?: string;
}

export interface LegendItemDoubleClickEvent {
    readonly legendType: ChartLegendType;
    readonly enabled: boolean;
    readonly series: any;
    readonly itemId: any;
    readonly legendItemName?: string;
    readonly numVisibleItems: number;
}

export interface SeriesKeyNavZoomEvent {
    readonly delta: -1 | 0 | 1;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface ZoomChangeEvent extends AxisZoomState {
    readonly callerId: string;
    readonly axes: Record<string, Readonly<ZoomState> | undefined>;
    readonly x?: Readonly<ZoomState>;
    readonly y?: Readonly<ZoomState>;
}

export interface ZoomPanStartEvent {
    readonly callerId: string;
}
