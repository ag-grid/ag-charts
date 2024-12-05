import type { AgChartLegendClickEvent, AgChartLegendDoubleClickEvent } from 'ag-charts-types';

type LegendEventState<T extends AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> = {
    apiEvent: T;
    defaultPrevented: boolean;
};

export function makeLegendItemEvent<T extends 'click'>(
    type: T,
    itemId: string,
    seriesId: string,
    event: Event
): LegendEventState<AgChartLegendClickEvent>;

export function makeLegendItemEvent<T extends 'dblclick'>(
    type: T,
    itemId: string,
    seriesId: string,
    event: Event
): LegendEventState<AgChartLegendDoubleClickEvent>;

export function makeLegendItemEvent(
    type: 'click' | 'dblclick',
    itemId: string,
    seriesId: string,
    event: Event
): LegendEventState<AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> {
    const result: LegendEventState<AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> = {
        defaultPrevented: false,
        apiEvent: {
            type,
            itemId,
            seriesId,
            event,
            preventDefault: () => (result.defaultPrevented = true),
        },
    };
    return result;
}
