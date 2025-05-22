import { EventEmitter } from 'ag-charts-core';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { HighlightNodeDatum } from '../chart/interaction/highlightManager';
import type { ChartLegendType } from '../chart/legend/legendDatum';
import type { KeyboardWidgetEvent } from '../widget/widgetEvents';

export interface EventsHubMap {
    'axis:hover': AxisHoverEvent;
    'highlight:change': HighlightChangeEvent;
    'legend:item-click': LegendItemClickEvent;
    'legend:item-double-click': LegendItemDoubleClickEvent;
    'series:focus-change': null;
    'series:keynav-zoom': SeriesKeyNavZoomEvent;
    'series:redo': null;
    'series:undo': null;
}

export type EventsHub = EventEmitter<EventsHubMap>;

export interface AxisHoverEvent {
    readonly axisId: string;
    readonly direction: ChartAxisDirection;
}

export interface SeriesKeyNavZoomEvent {
    readonly delta: -1 | 0 | 1;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface LegendItemClickEvent {
    readonly legendType: ChartLegendType;
    readonly series: any;
    readonly itemId: any;
    readonly enabled: boolean;
    readonly legendItemName?: string;
}

export interface LegendItemDoubleClickEvent {
    readonly legendType: ChartLegendType;
    readonly series: any;
    readonly itemId: any;
    readonly enabled: boolean;
    readonly legendItemName?: string;
    readonly numVisibleItems: number;
}

export interface HighlightChangeEvent {
    readonly previousHighlight?: HighlightNodeDatum;
    readonly currentHighlight?: HighlightNodeDatum;
    readonly callerId: string;
}
