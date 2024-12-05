import { afterEach, describe, expect } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartLegendClickEvent,
    AgChartLegendDoubleClickEvent,
    AgSeriesVisibilityChange,
} from 'ag-charts-types';

import type { Chart } from '../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    createChart,
    doubleClickAction,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

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
        const actualKeys = Object.getOwnPropertyNames(event).sort((a, b) => a.localeCompare(b, 'en-US'));
        const expectKeys = Object.keys(matcherObject).sort((a, b) => a.localeCompare(b, 'en-US'));
        expect(actualKeys).toEqual(expectKeys);
    });
}

describe('LegendEvent', () => {
    setupMockConsole();
    let chart: Chart;
    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

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
                event: null,
                preventDefault: null,
            });

            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemClick } } });
            await clickAction(355, 575)(chart);
            expect(legendItemClick).toBeCalledTimes(1);
        });

        test('dblclick', async () => {
            const legendItemDoubleClick = strictKeyMatcher<AgChartLegendDoubleClickEvent>({
                type: null,
                seriesId: null,
                itemId: null,
                event: null,
                preventDefault: null,
            });

            chart = await createChart({ ...OPTIONS, legend: { listeners: { legendItemDoubleClick } } });
            await doubleClickAction(355, 575)(chart);
            expect(legendItemDoubleClick).toBeCalledTimes(1);
        });

        test('visibilityChange', async () => {
            const seriesVisibilityChange = strictKeyMatcher<AgSeriesVisibilityChange>({
                type: null,
                seriesId: null,
                visible: null,
                preventDefault: null,
            });

            chart = await createChart({ ...OPTIONS, listeners: { seriesVisibilityChange } });
            await clickAction(355, 575)(chart);
            expect(seriesVisibilityChange).toBeCalledTimes(1);
        });
    });

    describe('click and visibility change events', () => {
        test('call order', async () => {
            const legendItemClick = jest.fn((_event: AgChartLegendClickEvent) => {
                expect(seriesVisibilityChange).not.toBeCalled();
            });
            const seriesVisibilityChange = jest.fn((_event: AgSeriesVisibilityChange) => {
                expect(legendItemClick).toBeCalled();
            });
            chart = await createChart({
                ...OPTIONS,
                listeners: { seriesVisibilityChange },
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(355, 575)(chart);
            expect(legendItemClick).toBeCalledTimes(1);
            expect(seriesVisibilityChange).toBeCalledTimes(1);
        });

        test('legendItemClick preventDefault', async () => {
            const legendItemClick = jest.fn((event: AgChartLegendClickEvent) => {
                event.preventDefault();
            });
            const seriesVisibilityChange = jest.fn((_event: AgSeriesVisibilityChange) => {});

            chart = await createChart({
                ...OPTIONS,
                listeners: { seriesVisibilityChange },
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(355, 575)(chart);
            expect(legendItemClick).toBeCalledTimes(1);
            expect(seriesVisibilityChange).not.toBeCalled();
            await compare();
        });

        test('seriesVisibilityChange preventDefault', async () => {
            const legendItemClick = jest.fn((_event: AgChartLegendClickEvent) => {});
            const seriesVisibilityChange = jest.fn((event: AgSeriesVisibilityChange) => {
                event.preventDefault();
            });

            chart = await createChart({
                ...OPTIONS,
                listeners: { seriesVisibilityChange },
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(355, 575)(chart);
            expect(legendItemClick).toBeCalledTimes(1);
            expect(seriesVisibilityChange).toBeCalledTimes(1);
            await compare();
        });
    });
});
