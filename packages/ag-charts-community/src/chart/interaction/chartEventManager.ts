import { BaseManager } from '../../util/baseManager';
import type { KeyboardWidgetEvent } from '../../widget/widgetEvents';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartLegendType } from '../legend/legendDatum';

type ChartEventType =
    | 'series-focus-change'
    | 'series-keynav-zoom'
    | 'series-redo'
    | 'series-undo'
    | 'legend-item-click'
    | 'legend-item-double-click'
    | 'axis-hover';
type ChartEvents =
    | ChartEvent<'series-focus-change'>
    | SeriesKeyNavZoomChartEvent
    | ChartEvent<'series-redo'>
    | ChartEvent<'series-undo'>
    | LegendItemClickChartEvent
    | LegendItemDoubleClickChartEvent
    | AxisHoverChartEvent;

interface ChartEvent<T> {
    readonly type: T;
}

export interface SeriesKeyNavZoomChartEvent extends ChartEvent<'series-keynav-zoom'> {
    readonly delta: -1 | 0 | 1;
    readonly widgetEvent: KeyboardWidgetEvent<'keydown'>;
}

export interface LegendItemClickChartEvent extends ChartEvent<'legend-item-click'> {
    readonly legendType: ChartLegendType;
    readonly series: any;
    readonly itemId: any;
    readonly enabled: boolean;
    readonly legendItemName?: string;
}

export interface LegendItemDoubleClickChartEvent extends ChartEvent<'legend-item-double-click'> {
    readonly legendType: ChartLegendType;
    readonly series: any;
    readonly itemId: any;
    readonly enabled: boolean;
    readonly legendItemName?: string;
    readonly numVisibleItems: number;
}

export interface AxisHoverChartEvent extends ChartEvent<'axis-hover'> {
    readonly axisId: string;
    readonly direction: ChartAxisDirection;
}

export class ChartEventManager extends BaseManager<ChartEventType, ChartEvents> {
    seriesEvent(type: 'series-focus-change' | 'series-redo' | 'series-undo') {
        this.listeners.dispatch(type, { type });
    }

    seriesKeyNavZoom(delta: -1 | 0 | 1, widgetEvent: KeyboardWidgetEvent<'keydown'>) {
        const event: SeriesKeyNavZoomChartEvent = { type: 'series-keynav-zoom', delta, widgetEvent };
        this.listeners.dispatch('series-keynav-zoom', event);
    }

    legendItemClick(legendType: ChartLegendType, series: any, itemId: any, enabled: boolean, legendItemName?: string) {
        const event: LegendItemClickChartEvent = {
            type: 'legend-item-click',
            legendType,
            series,
            itemId,
            enabled,
            legendItemName,
        };

        this.listeners.dispatch('legend-item-click', event);
    }

    legendItemDoubleClick(
        legendType: ChartLegendType,
        series: any,
        itemId: any,
        enabled: boolean,
        numVisibleItems: number,
        legendItemName?: string
    ) {
        const event: LegendItemDoubleClickChartEvent = {
            type: 'legend-item-double-click',
            legendType,
            series,
            itemId,
            enabled,
            legendItemName,
            numVisibleItems,
        };

        this.listeners.dispatch('legend-item-double-click', event);
    }

    axisHover(axisId: string, direction: ChartAxisDirection) {
        const event: AxisHoverChartEvent = {
            type: 'axis-hover',
            axisId,
            direction,
        };

        this.listeners.dispatch('axis-hover', event);
    }
}
