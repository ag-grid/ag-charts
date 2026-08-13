import { toPlainText } from 'ag-charts-core';
import type { AgChartLegendClickEvent, AgChartLegendDoubleClickEvent } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legendDatum';

type LegendEventState<T extends AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> = {
    apiEvent: T;
    defaultPrevented: boolean;
};

export function makeLegendItemEvent<T extends 'click'>(
    type: T,
    datum: CategoryLegendDatum,
    event: Event
): LegendEventState<AgChartLegendClickEvent>;

export function makeLegendItemEvent<T extends 'dblclick'>(
    type: T,
    datum: CategoryLegendDatum,
    event: Event
): LegendEventState<AgChartLegendDoubleClickEvent>;

export function makeLegendItemEvent(
    type: 'click' | 'dblclick',
    { itemId, seriesId, enabled, label: { text } }: CategoryLegendDatum,
    event: Event
): LegendEventState<AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> {
    const result: LegendEventState<AgChartLegendClickEvent | AgChartLegendDoubleClickEvent> = {
        defaultPrevented: false,
        apiEvent: {
            type,
            itemId,
            seriesId,
            event,
            visible: enabled,
            text: toPlainText(text),
            get defaultPrevented() {
                return result.defaultPrevented;
            },
            preventDefault: () => {
                result.defaultPrevented = true;
            },
        },
    };
    return result;
}
