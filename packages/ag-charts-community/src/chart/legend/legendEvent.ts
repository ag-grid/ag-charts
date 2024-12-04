import type { AgChartLegendClickEvent, AgChartLegendDoubleClickEvent } from 'ag-charts-types';

export function makeLegendItemEvent<T extends 'click'>(
    type: T,
    itemId: string,
    seriesId: string,
    event: Event
): AgChartLegendClickEvent;

export function makeLegendItemEvent<T extends 'dblclick'>(
    type: T,
    itemId: string,
    seriesId: string,
    event: Event
): AgChartLegendDoubleClickEvent;

export function makeLegendItemEvent(
    type: 'click' | 'dblclick',
    itemId: string,
    seriesId: string,
    event: Event
): AgChartLegendClickEvent | AgChartLegendDoubleClickEvent {
    let _defaultPrevented = false;

    return {
        type,
        itemId,
        seriesId,
        event,
        preventDefault: () => {
            _defaultPrevented = true;
        },
        get defaultPrevented(): boolean {
            return _defaultPrevented;
        },
    };
}
