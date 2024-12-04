import type { AgChartLegendClickEvent, AgChartLegendDoubleClickEvent } from 'ag-charts-types';

import { defineSetterGetter } from '../../util/object';

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

    const that = {
        type,
        itemId,
        seriesId,
        event,
        preventDefault: (): void => {
            _defaultPrevented = true;
        },
    };

    return defineSetterGetter(that, 'defaultPrevented', {
        get: function () {
            return _defaultPrevented;
        },
    });
}
