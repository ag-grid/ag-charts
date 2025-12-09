import { afterEach, describe, expect } from '@jest/globals';

import { AgChartInstance, type AgChartOptions, AgChartState, AgCharts, AgZoomEvent } from 'ag-charts-community';
import {
    MockZoomListener,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { deepFreeze } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

function newFreezableZoomListenerMock() {
    return newFreezableMock<unknown, unknown, MockZoomListener<unknown, unknown>>();
}

describe('Zoom', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    async function prepareChart<D>(options: AgChartOptions<D> & { data: D[] }): Promise<D[]> {
        chart = AgCharts.create(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);
        return options.data;
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('numberAxis', () => {
        type TDatum = { x: number; y: number };
        let chartData: TDatum[];

        async function appendDatum() {
            expect(chartData).toBeDefined();
            const data = [...chartData, { x: 8, y: 50 }];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function prependDatum() {
            expect(chartData).toBeDefined();
            const data = [{ x: -1, y: 50 }, ...chartData];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function insertMiddleDatum() {
            expect(chartData).toBeDefined();
            const orig = chartData;
            const data = [...orig.slice(0, 4), { x: 3.5, y: 50 }, ...orig.slice(4)];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function insertMiddleDatumNegative() {
            expect(chartData).toBeDefined();
            const orig = chartData;
            const data = [...orig.slice(0, 4), { x: 3.5, y: -20 }, ...orig.slice(4)];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        describe('preserveDomain', () => {
            let zoomListener: ReturnType<typeof newFreezableZoomListenerMock>;
            let initialRatioX: Pick<AgZoomEvent, 'ratioX'>;
            let initialRatioY: Pick<AgZoomEvent, 'ratioY'>;
            let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
            beforeEach(async () => {
                zoomListener = newFreezableZoomListenerMock();
                chartData = await prepareChart({
                    data: [
                        { x: 0, y: 0 },
                        { x: 1, y: 50 },
                        { x: 2, y: 25 },
                        { x: 3, y: 75 },
                        { x: 4, y: 50 },
                        { x: 5, y: 25 },
                        { x: 6, y: 50 },
                        { x: 7, y: 75 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            nice: false,
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                        },
                    },
                    initialState: {
                        zoom: {
                            rangeX: { start: 2.5, end: 5.75 },
                        },
                    },
                    listeners: {
                        zoom: zoomListener.frozen,
                    },
                    zoom: {
                        enabled: true,
                        onDataChange: {
                            strategy: 'preserveDomain',
                        },
                    },
                });
                const { zoom } = chart.getState();
                expect(zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                initialRatioX = { ratioX: { start: zoom!.ratioX!.start!, end: zoom!.ratioX!.end! } };
                initialRatioY = { ratioY: { start: zoom!.ratioY!.start!, end: zoom!.ratioY!.end! } };
                initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                zoomListener.mock.mockClear();
            });
            test('append datum', async () => {
                await appendDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(state.zoom).not.toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
            });
            test('prepend datum', async () => {
                await prependDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(state.zoom).not.toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
            });
            test('insert-middle datum', async () => {
                await insertMiddleDatum(); // Y-zoom unchanged
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(state.zoom).toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(0);
            });
            test('insert-middle datum (negative)', async () => {
                await insertMiddleDatumNegative(); // Y-zoom changed
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(state.zoom).toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).not.toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioY);
            });
        });
        describe('preserveRatios', () => {
            let zoomListener: ReturnType<typeof newFreezableZoomListenerMock>;
            let initialRangeX: Pick<AgZoomEvent, 'rangeX'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeX'>;
            let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
            beforeEach(async () => {
                zoomListener = newFreezableZoomListenerMock();
                await prepareChart({
                    data: [
                        { x: 0, y: 0 },
                        { x: 1, y: 50 },
                        { x: 2, y: 25 },
                        { x: 3, y: 75 },
                        { x: 4, y: 50 },
                        { x: 5, y: 25 },
                        { x: 6, y: 50 },
                        { x: 7, y: 75 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: {
                            type: 'number',
                            position: 'bottom',
                            nice: false,
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                        },
                    },
                    initialState: {
                        zoom: {
                            ratioX: { start: 0.25, end: 0.75 },
                        },
                    },
                    listeners: {
                        zoom: zoomListener.frozen,
                    },
                    zoom: {
                        enabled: true,
                        onDataChange: {
                            strategy: 'preserveRatios',
                        },
                    },
                });
                const { zoom } = chart.getState();
                expect(zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                initialRangeX = { rangeX: { start: zoom!.rangeX!.start!, end: zoom!.rangeX!.end! } };
                initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                zoomListener.mock.mockClear();
            });
            test('append datum', async () => {
                await appendDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(state.zoom).not.toMatchObject(initialRangeX);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
            });
            test('prepend datum', async () => {
                await prependDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(state.zoom).not.toMatchObject(initialRangeX);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
            });
            test('insert-middle datum', async () => {
                await insertMiddleDatum(); // Y-zoom unchanged
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(state.zoom).toMatchObject(initialRangeX);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(0);
            });
            test('insert-middle datum (negative)', async () => {
                await insertMiddleDatumNegative(); // Y-zoom changed
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(state.zoom).toMatchObject(initialRangeX);
                expect(state.zoom).not.toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
            });
        });
    });
    describe('ordinalTimeAxis', () => {
        type TDatum = { date: Date; value: number };
        let chartData: TDatum[];

        async function appendDatum() {
            expect(chartData).toBeDefined();
            const datum: TDatum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            const data = [...chartData, datum];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function prependDatum() {
            expect(chartData).toBeDefined();
            const datum: TDatum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            const data = [datum, ...chartData];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function insertMiddleDatum() {
            expect(chartData).toBeDefined();
            const datum: TDatum = { date: new Date('2024-04-04'), value: 50 }; // Wednesday
            const data = [...chartData.slice(0, 4), datum, ...chartData.slice(4)];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        async function insertMiddleDatumNegative() {
            expect(chartData).toBeDefined();
            const datum: TDatum = { date: new Date('2024-04-04'), value: -20 }; // Wednesday
            const data = [...chartData.slice(0, 4), datum, ...chartData.slice(4)];
            await chart.updateDelta({ data });
            await waitForChartStability(chart);
        }
        describe('preserveDomain', () => {
            let zoomListener: ReturnType<typeof newFreezableZoomListenerMock>;
            let initialRatioX: Pick<AgZoomEvent, 'ratioX'>;
            let initialRatioY: Pick<AgZoomEvent, 'ratioY'>;
            let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
            const expectedRangeXSerialized = deepFreeze({
                rangeX: {
                    start: { __type: 'date', value: '2024-04-23T00:00:00.000Z' }, // inclusive
                    end: { __type: 'date', value: '2024-04-26T00:00:00.000Z' }, // exclusive
                },
            } as const);
            const expectedRangeX = deepFreeze({
                rangeX: {
                    start: new Date('2024-04-23T00:00:00.000Z'), // inclusive
                    end: new Date('2024-04-26T00:00:00.000Z'), // exclusive
                },
            } as const);

            beforeEach(async () => {
                zoomListener = newFreezableZoomListenerMock();
                chartData = await prepareChart({
                    data: [
                        { date: new Date('2024-04-19'), value: 60 }, // Friday
                        // Skipping Saturday and Sunday
                        { date: new Date('2024-04-22'), value: 10 }, // Monday
                        { date: new Date('2024-04-23'), value: 20 }, // Tuesday
                        // Skipping Wednesday (24th)
                        { date: new Date('2024-04-25'), value: 40 }, // Thursday
                        { date: new Date('2024-04-26'), value: 50 }, // Friday
                        // Skipping Saturday and Sunday
                        { date: new Date('2024-04-29'), value: 60 }, // Monday
                    ],
                    series: [
                        {
                            type: 'bar',
                            xKey: 'date',
                            yKey: 'value',
                        },
                    ],
                    axes: {
                        x: {
                            type: 'ordinal-time',
                            position: 'bottom',
                            parentLevel: {
                                // Force more labels to show
                                enabled: true,
                            },
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                        },
                    },

                    initialState: {
                        zoom: {
                            rangeX: {
                                start: { __type: 'date', value: '2024-04-23' },
                                end: { __type: 'date', value: '2024-04-25' },
                            },
                        },
                    },
                    listeners: {
                        zoom: zoomListener.frozen,
                    },
                    zoom: {
                        enabled: true,
                        onDataChange: {
                            strategy: 'preserveDomain',
                        },
                    },
                });
                const { zoom } = chart.getState();
                expect(zoom).toMatchObject(expectedRangeXSerialized);
                initialRatioX = { ratioX: { start: zoom!.ratioX!.start!, end: zoom!.ratioX!.end! } };
                initialRatioY = { ratioY: { start: zoom!.ratioY!.start!, end: zoom!.ratioY!.end! } };
                initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
                zoomListener.mock.mockClear();
            });
            test('append datum', async () => {
                await appendDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject(expectedRangeXSerialized);
                expect(state.zoom).not.toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
            });
            test('prepend datum', async () => {
                await prependDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject(expectedRangeXSerialized);
                expect(state.zoom).not.toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
            });
            test('insert-middle datum', async () => {
                await insertMiddleDatum(); // Y-zoom unchanged
                const state = chart.getState();
                expect(state.zoom).toMatchObject(expectedRangeXSerialized);
                expect(state.zoom).toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(0);
            });
            test('insert-middle datum (negative)', async () => {
                await insertMiddleDatumNegative(); // Y-zoom changed
                const state = chart.getState();
                expect(state.zoom).toMatchObject(expectedRangeXSerialized);
                expect(state.zoom).toMatchObject(initialRatioX);
                expect(state.zoom).toMatchObject(initialRatioY);
                expect(state.zoom).not.toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioY);
            });
        });
        describe('preserveRatios', () => {
            // Interactive Version: https://plnkr.co/edit/Rf3MgQKwk0rGmYII?open=main.js
            let zoomListener: ReturnType<typeof newFreezableZoomListenerMock>;
            let initialRangeX: Pick<AgZoomEvent, 'rangeX'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeX'>;
            let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
            beforeEach(async () => {
                zoomListener = newFreezableZoomListenerMock();
                chartData = await prepareChart({
                    data: [
                        { date: new Date('2024-04-19'), value: 60 }, // Friday
                        // Skipping Saturday and Sunday
                        { date: new Date('2024-04-22'), value: 10 }, // Monday
                        { date: new Date('2024-04-23'), value: 20 }, // Tuesday
                        // Skipping Wednesday (24th)
                        { date: new Date('2024-04-25'), value: 40 }, // Thursday
                        { date: new Date('2024-04-26'), value: 50 }, // Friday
                        // Skipping Saturday and Sunday
                        { date: new Date('2024-04-29'), value: 60 }, // Monday
                    ],
                    series: [
                        {
                            type: 'bar',
                            xKey: 'date',
                            yKey: 'value',
                        },
                    ],
                    axes: {
                        x: {
                            type: 'ordinal-time',
                            position: 'bottom',
                            parentLevel: {
                                // Force more labels to show
                                enabled: true,
                            },
                        },
                        y: {
                            type: 'number',
                            position: 'left',
                        },
                    },

                    initialState: {
                        zoom: {
                            ratioX: { start: 0.25, end: 0.7 },
                        },
                    },
                    listeners: {
                        zoom: zoomListener.frozen,
                    },
                    zoom: {
                        enabled: true,
                        onDataChange: {
                            strategy: 'preserveRatios',
                        },
                    },
                });
                const { zoom } = chart.getState();
                expect(zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                initialRangeX = { rangeX: { start: zoom!.rangeX!.start!, end: zoom!.rangeX!.end! } };
                initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                zoomListener.mock.mockClear();
            });
            test('append datum', async () => {
                await appendDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(state.zoom).not.toMatchObject(initialRangeX);
                expect(state.zoom).not.toMatchObject(initialRangeY); // it makes day 26 (value 50) visible
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
            });
            test('prepend datum', async () => {
                await prependDatum();
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(state.zoom).not.toMatchObject(initialRangeX);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
            });
            test('insert-middle datum', async () => {
                await insertMiddleDatum(); // Y-zoom unchanged
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(state.zoom).toMatchObject(initialRangeX);
                expect(state.zoom).toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(0);
            });
            test('insert-middle datum (negative)', async () => {
                await insertMiddleDatumNegative(); // Y-zoom changed
                const state = chart.getState();
                expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(state.zoom).toMatchObject(initialRangeX);
                expect(state.zoom).not.toMatchObject(initialRangeY);
                expect(zoomListener.mock).toBeCalledTimes(1);
                expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
                expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
            });
        });
    });
});
