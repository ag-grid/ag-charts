import { afterEach, describe, expect } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartLegendClickEvent, AgChartLegendDoubleClickEvent } from 'ag-charts-types';

import type { Chart } from '../chart';
import { clickAction, createChart, doubleClickAction, setupMockConsole } from '../test/utils';

const OPTIONS: AgCartesianChartOptions = {
    data: [
        { x: 0, tomato: 5, potato: 3 },
        { x: 1, tomato: 5, potato: 3 },
    ],
    series: [
        { type: 'line', xKey: 'x', yKey: 'tomato' },
        { type: 'line', xKey: 'x', yKey: 'potato' },
    ],
};

function strictKeyMatcher<T>(matcherObject: { [K in keyof T]: null }) {
    return jest.fn((event: object) => {
        const actualKeys = Object.getOwnPropertyNames(event).sort();
        const expectKeys = Object.keys(matcherObject).sort();
        expect(actualKeys).toEqual(expectKeys);
    });
}

describe('LegendEvent', () => {
    setupMockConsole();
    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('No extra properties', () => {
        test('click', async () => {
            const legendItemClick = strictKeyMatcher<AgChartLegendClickEvent>({
                type: null,
                seriesId: null,
                itemId: null,
                defaultPrevented: null,
                event: null,
                preventDefault: null,
            });

            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemClick } } });
            clickAction(355, 570)(chart);
            expect(legendItemClick).toBeCalledTimes(1);
        });

        test('dblclick', async () => {
            const legendItemDoubleClick = strictKeyMatcher<AgChartLegendDoubleClickEvent>({
                type: null,
                seriesId: null,
                itemId: null,
                defaultPrevented: null,
                event: null,
                preventDefault: null,
            });

            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemDoubleClick } } });
            doubleClickAction(355, 570)(chart);
            expect(legendItemDoubleClick).toBeCalledTimes(1);
        });
    });

    describe('defaultPrevented must be readonly', () => {
        let handler: jest.Mock;

        beforeEach(() => {
            handler = jest.fn((event: AgChartLegendClickEvent | AgChartLegendDoubleClickEvent) => {
                expect(() => ((event as any).defaultPrevented = false)).toThrow(TypeError);
            });
        });

        test('click', async () => {
            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemClick: handler } } });
            clickAction(355, 570)(chart);
            expect(handler).toBeCalledTimes(1);
        });

        test('dblclick', async () => {
            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemDoubleClick: handler } } });
            doubleClickAction(355, 570)(chart);
            expect(handler).toBeCalledTimes(1);
        });
    });
});
