import type { AxisID, Scale } from 'ag-charts-core';
import { EventEmitter } from 'ag-charts-core';
import type { AgAnnotation, AgContextMenuItemShowOn, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { CartesianAxisDirection, ChartAxisDirection } from '../chart/chartAxisDirection';
import { DataSet } from '../chart/data/dataSet';
import type { ContextShowOnMap } from '../chart/interaction/contextMenuTypes';
import type { CategoryLegendDatum, ChartLegendType } from '../chart/legend/legendDatum';
import type { DatumIndexType, SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { BBox } from '../scene/bbox';
import type { KeyboardWidgetEvent, MouseWidgetEvent } from '../widget/widgetEvents';

export type EventsHub = EventEmitter<EventsHubMap>;

export interface SeriesAreaHoverEvent {
    readonly x: number;
    readonly y: number;
    readonly consumed: boolean;
    readonly sourceEvent: Event;
}

export interface SeriesAreaClickEvent {
    readonly x: number;
    readonly y: number;
    readonly consumed: boolean;
    readonly sourceEvent: Event;
}

// Event name convention is 'module:event-name'
export interface EventsHubMap {
    'annotations:restore': AnnotationsRestoreEvent;
    'axis:hover': AxisHoverEvent;
    'axis:change': null;
    'context-menu:setup': ContextMenuEvent;
    'context-menu:complete': ContextMenuEvent;
    'data:load': { data: unknown[] };
    'data:error': null;
    'data:update': DataSet | undefined;
    'data:source-change': null;
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
    'zoom:change-request': ZoomChangeRequestedEvent;
    'zoom:change-complete': null;
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

export interface LayoutCompleteEvent {
    readonly chart: Readonly<{ width: number; height: number }>;
    readonly series: Readonly<{ rect: BBox; paddedRect: BBox; visible: boolean }>;
    readonly clipSeries: boolean;
    readonly axes?: Readonly<AxisLayout>[];
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

export type ZoomChangeType = 'layoutComplete' | 'panToBBox' | 'reset' | 'restoreMemento' | 'update' | 'setAxes';

export interface ZoomChangeRequestedEvent extends AxisZoomState {
    readonly callerId: string;
    readonly changeType: ZoomChangeType;
    readonly changedAxes: readonly AxisID[];
    readonly state: { readonly [K in AxisID]: Readonly<ZoomStateDirection> | undefined };
    readonly x?: Readonly<ZoomState>;
    readonly y?: Readonly<ZoomState>;
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

export interface ZoomState {
    min: number;
    max: number;
}

export interface ZoomStateDirection extends ZoomState {
    direction: 'x' | 'y';
}

export interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
    autoScaleYAxis?: boolean;
}

export interface AxisLayout {
    id: string;
    rect: BBox;
    gridPadding: number;
    seriesAreaPadding: number;
    tickSize: number;
    label: {
        fractionDigits: number;
        spacing: number;
        format?: string | Record<string, string>;
    };
    direction: ChartAxisDirection;
    domain: any[];
    scale: Scale<any, any, number | AgTimeInterval | AgTimeIntervalUnit>;
}
