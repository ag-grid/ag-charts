import { afterEach, describe, expect } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartLegendClickEvent,
    AgChartLegendDoubleClickEvent,
    AgSeriesVisibilityChange,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
    extractImageData,
    prepareTestOptions,
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
        { id: 'id-1', type: 'line', xKey: 'x', yKey: 'tomato' },
        { id: 'id-2', type: 'line', xKey: 'x', yKey: 'potato' },
    ],
};

function strictKeyMatcher<T>(matcherObject: { [K in keyof T]: null }) {
    return jest.fn((event: object) => {
        const actualKeys = Object.getOwnPropertyNames(event).sort((a, b) => a.localeCompare(b, 'en-US'));
        const expectKeys = Object.keys(matcherObject).sort((a, b) => a.localeCompare(b, 'en-US'));
        expect(actualKeys).toEqual(expectKeys);
    });
}

describe.skip('LegendEvent', () => {
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
                text: null,
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
                text: null,
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
                itemId: null,
                legendItemName: null,
            });

            chart = await createChart({ ...OPTIONS, listeners: { seriesVisibilityChange } });
            await clickAction(355, 575)(chart);
            expect(seriesVisibilityChange).toBeCalledTimes(1);
        });

        test('visibilityChange-pie', async () => {
            const seriesVisibilityChange = jest.fn((event: AgSeriesVisibilityChange) => {
                expect(event).toStrictEqual({
                    type: 'seriesVisibilityChange',
                    seriesId: 'PieSeries-1',
                    visible: false,
                    itemId: 0,
                    legendItemName: 'tomato',
                });
            });
            chart = await createChart({
                data: [
                    { name: 'tomato', value: 5 },
                    { name: 'potato', value: 3 },
                ],
                series: [{ type: 'pie', legendItemKey: 'name', angleKey: 'value' }],
                listeners: { seriesVisibilityChange },
            });
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
    });

    describe('update', () => {
        test('initialState legend change triggers visibility change', async () => {
            const seriesVisibilityChange = jest.fn((_event: AgSeriesVisibilityChange) => {});

            const opts = prepareTestOptions({ ...OPTIONS, listeners: { seriesVisibilityChange } });
            const apiChart = AgCharts.create(opts);
            chart = deproxy(apiChart);
            await waitForChartStability(chart);
            await apiChart.update({
                ...opts,
                initialState: {
                    legend: [
                        { seriesId: 'id-1', visible: true },
                        { seriesId: 'id-2', visible: false },
                    ],
                },
            });
            await waitForChartStability(chart);

            expect(seriesVisibilityChange).nthCalledWith(1, {
                type: 'seriesVisibilityChange',
                seriesId: 'id-1',
                visible: true,
                itemId: undefined,
                legendItemName: undefined,
            });
            expect(seriesVisibilityChange).nthCalledWith(2, {
                type: 'seriesVisibilityChange',
                seriesId: 'id-2',
                visible: false,
                itemId: undefined,
                legendItemName: undefined,
            });
        });
    });

    describe('label.text', () => {
        test('line', async () => {
            // https://plnkr.co/edit/95LNJoaB0eYqh6DU?open=main.js&preview
            const legendItemClick = jest.fn((_event: AgChartLegendClickEvent) => {});
            chart = await createChart({
                data: [
                    { x: 0, Au: 3, Ag: 5, Cu: 3 },
                    { x: 1, Au: 5, Ag: 7, Cu: 3 },
                    { x: 2, Au: 1, Ag: 2, Cu: 6 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'Au', yName: 'Gold' },
                    { type: 'line', xKey: 'x', yKey: 'Ag', yName: 'Silver' },
                    { type: 'line', xKey: 'x', yKey: 'Cu', yName: 'Copper' },
                ],
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(313, 573)(chart);
            await clickAction(394, 573)(chart);
            await clickAction(493, 573)(chart);
            expect(legendItemClick.mock.calls[0][0].text).toEqual('Gold');
            expect(legendItemClick.mock.calls[1][0].text).toEqual('Silver');
            expect(legendItemClick.mock.calls[2][0].text).toEqual('Copper');
            expect(legendItemClick).toBeCalledTimes(3);
        });

        test('pie', async () => {
            // https://plnkr.co/edit/BoHbSyw1KYOpprOg?open=main.js
            const legendItemClick = jest.fn((_event: AgChartLegendClickEvent) => {});
            chart = await createChart({
                data: [
                    { votes: 30, name: 'Labour' },
                    { votes: 30, name: 'LibDem' },
                    { votes: 30, name: 'Greens' },
                ],
                series: [{ type: 'pie', angleKey: 'votes', legendItemKey: 'name' }],
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(325, 573)(chart);
            await clickAction(398, 573)(chart);
            await clickAction(496, 573)(chart);
            expect(legendItemClick.mock.calls[0][0].text).toEqual('Labour');
            expect(legendItemClick.mock.calls[1][0].text).toEqual('LibDem');
            expect(legendItemClick.mock.calls[2][0].text).toEqual('Greens');
            expect(legendItemClick).toBeCalledTimes(3);
        });

        test('donuts', async () => {
            // https://plnkr.co/edit/BoHbSyw1KYOpprOg?open=main.js
            const legendItemClick = jest.fn((_event: AgChartLegendClickEvent) => {});
            chart = await createChart({
                data: [
                    { votes2020: 10, votes2024: 30, name: 'Labour' },
                    { votes2020: 20, votes2024: 30, name: 'LibDem' },
                    { votes2020: 30, votes2024: 30, name: 'Greens' },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'votes2020',
                        calloutLabelKey: 'name',
                        outerRadiusRatio: 0.6,
                        innerRadiusRatio: 0.4,
                        title: { text: '2020', showInLegend: true },
                    },
                    {
                        type: 'donut',
                        angleKey: 'votes2024',
                        calloutLabelKey: 'name',
                        outerRadiusRatio: 1,
                        innerRadiusRatio: 0.8,
                        title: { text: '2024', showInLegend: true },
                    },
                ],
                legend: { listeners: { legendItemClick } },
            });
            await clickAction(272, 550)(chart);
            await clickAction(401, 550)(chart);
            await clickAction(538, 550)(chart);
            await clickAction(275, 572)(chart);
            await clickAction(402, 572)(chart);
            await clickAction(525, 572)(chart);

            expect(legendItemClick.mock.calls[0][0].text).toEqual('2020 - Labour');
            expect(legendItemClick.mock.calls[1][0].text).toEqual('2020 - LibDem');
            expect(legendItemClick.mock.calls[2][0].text).toEqual('2020 - Greens');
            expect(legendItemClick.mock.calls[3][0].text).toEqual('2024 - Labour');
            expect(legendItemClick.mock.calls[4][0].text).toEqual('2024 - LibDem');
            expect(legendItemClick.mock.calls[5][0].text).toEqual('2024 - Greens');
            expect(legendItemClick).toBeCalledTimes(6);
        });
    });
});
