import { BaseManager } from '../../util/baseManager';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartLegendType } from '../legend/legendDatum';

type ChartEventType = 'legend-item-click' | 'legend-item-double-click' | 'axis-hover';
type ChartEvents = LegendItemClickChartEvent | LegendItemDoubleClickChartEvent | AxisHoverChartEvent;

interface ChartEvent<T> {
    readonly type: T;
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
