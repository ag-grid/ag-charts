import { afterEach, describe, expect } from '@jest/globals';

import { AgChartInstance, type AgChartOptions, AgChartState, AgCharts, AgZoomEvent } from 'ag-charts-community';
import {
    MockZoomListener,
    clickAction,
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

    let chart: AgChartInstance;
    setupMockCanvas();

    const EXAMPLE_OPTIONS: AgChartOptions = {
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
        zoom: {
            enabled: true,
            axes: 'xy',
            scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
            minVisibleItems: 1,
        },
    };

    const UGLY_NUMBER_EXAMPLE_OPTIONS: AgChartOptions = {
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
        zoom: {
            enabled: true,
            axes: 'xy',
            scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
            minVisibleItems: 1,
        },
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
    };

    const ORDINAL_EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { date: new Date('2024-04-19'), value: 60 }, // Friday
            // Skipping Saturday and Sunday
            { date: new Date('2024-04-22'), value: 10 }, // Monday
            { date: new Date('2024-04-23'), value: 20 }, // Tuesday
            { date: new Date('2024-04-24'), value: 30 }, // Wednesday
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
    };

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(
        zoomOptions?: AgChartOptions['zoom'],
        initialState?: NonNullable<AgChartOptions['initialState']>['zoom'],
        baseOptions = EXAMPLE_OPTIONS,
        clickAfterCreate = true
    ) {
        const options: AgChartOptions = {
            ...baseOptions,
            initialState: { zoom: initialState },
            zoom: { ...baseOptions.zoom, ...(zoomOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        if (clickAfterCreate) {
            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
        }
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('AG-8627 onDataChange', () => {
        describe('numberAxis', () => {
            async function appendDatum() {
                const data = [...UGLY_NUMBER_EXAMPLE_OPTIONS.data!, { x: 8, y: 50 }];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function prependDatum() {
                const data = [{ x: -1, y: 50 }, ...UGLY_NUMBER_EXAMPLE_OPTIONS.data!];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function insertMiddleDatum() {
                const orig = UGLY_NUMBER_EXAMPLE_OPTIONS.data!;
                const data = [...orig.slice(0, 4), { x: 3.5, y: 50 }, ...orig.slice(4)];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function insertMiddleDatumNegative() {
                const orig = UGLY_NUMBER_EXAMPLE_OPTIONS.data!;
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
                    await prepareChart(
                        { onDataChange: { strategy: 'preserveDomain' } },
                        { rangeX: { start: 2.5, end: 5.75 } },
                        {
                            ...UGLY_NUMBER_EXAMPLE_OPTIONS,
                            listeners: { zoom: zoomListener.frozen },
                        }
                    );
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
                    await prepareChart(
                        { onDataChange: { strategy: 'preserveRatios' } },
                        { ratioX: { start: 0.25, end: 0.75 } },
                        {
                            ...UGLY_NUMBER_EXAMPLE_OPTIONS,
                            listeners: { zoom: zoomListener.frozen },
                        }
                    );
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
            async function appendDatum() {
                const data = [
                    ...ORDINAL_EXAMPLE_OPTIONS.data!,
                    { date: new Date('2024-04-30'), value: 50 }, // Tuesday
                ];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function prependDatum() {
                const data = [
                    { date: new Date('2024-04-18'), value: 50 }, // Thursday
                    ...ORDINAL_EXAMPLE_OPTIONS.data!,
                ];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function insertMiddleDatum() {
                const orig = ORDINAL_EXAMPLE_OPTIONS.data!;
                const data = [
                    ...orig.slice(0, 4),
                    { date: new Date('2024-04-24T12:00:00'), value: 35 }, // Wednesday (midday)
                    ...orig.slice(4),
                ];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            async function insertMiddleDatumNegative() {
                const orig = ORDINAL_EXAMPLE_OPTIONS.data!;
                const data = [
                    ...orig.slice(0, 4),
                    { date: new Date('2024-04-24T12:00:00'), value: -20 }, // Wednesday (midday)
                    ...orig.slice(4),
                ];
                await chart.updateDelta({ data });
                await waitForChartStability(chart);
            }
            describe('preserveDomain', () => {
                // Interactive Version: https://plnkr.co/edit/ksIixFaQJYhzI1fU?open=main.js
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
                    await prepareChart(
                        { onDataChange: { strategy: 'preserveDomain' } },
                        {
                            rangeX: {
                                start: { __type: 'date', value: '2024-04-23' },
                                end: { __type: 'date', value: '2024-04-25' },
                            },
                        },
                        {
                            ...ORDINAL_EXAMPLE_OPTIONS,
                            listeners: { zoom: zoomListener.frozen },
                        }
                    );
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
                    await prepareChart(
                        { onDataChange: { strategy: 'preserveRatios' } },
                        { ratioX: { start: 0.25, end: 0.7 } },
                        {
                            ...ORDINAL_EXAMPLE_OPTIONS,
                            listeners: { zoom: zoomListener.frozen },
                        }
                    );
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
});
