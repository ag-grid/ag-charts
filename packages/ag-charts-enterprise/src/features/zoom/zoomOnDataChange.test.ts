import { afterEach, describe, expect } from '@jest/globals';

import { AgChartInstance, type AgChartOptions, AgChartState, AgCharts, AgZoomEvent } from 'ag-charts-community';
import {
    MockZoomListener,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { deepClone, deepFreeze } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

function newFreezableZoomListenerMock<D>() {
    return newFreezableMock<D, unknown, MockZoomListener<D, unknown>>();
}

type ZoomListener<D> = ReturnType<typeof newFreezableZoomListenerMock<D>>;

type MetaEntry<D> = {
    readonly options: AgChartOptions<D> & { data: D[] };
    readonly appendDatum: () => D[];
    readonly prependDatum: () => D[];
    readonly insertMiddleDatum: () => D[];
    readonly insertMiddleDatumNegative: () => D[];
};

type Meta = {
    'numberAxis-preserveDomain': MetaEntry<{ x: number; y: number }>;
    'numberAxis-preserveRatios': MetaEntry<{ x: number; y: number }>;
    'ordinalTimeAxis-preserveDomain': MetaEntry<{ date: Date; value: number }>;
    'ordinalTimeAxis-preserveRatios': MetaEntry<{ date: Date; value: number }>;
    'continuousTimeAxis-preserveDomain': MetaEntry<{ date: Date; value: number }>;
    'continuousTimeAxis-preserveRatios': MetaEntry<{ date: Date; value: number }>;
};

interface TestFixture<D> {
    meta: MetaEntry<D>;
    zoomListener: ZoomListener<D>;
    appendDatum(): Promise<void>;
    prependDatum(): Promise<void>;
    insertMiddleDatum(): Promise<void>;
    insertMiddleDatumNegative(): Promise<void>;
}

const meta: Meta = {
    'numberAxis-preserveDomain': {
        options: {
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveDomain',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data, { x: 8, y: 50 }];
        },
        prependDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [{ x: -1, y: 50 }, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data.slice(0, 4), { x: 3.5, y: 50 }, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['numberAxis-preserveDomain'].options;
            return [...data.slice(0, 4), { x: 3.5, y: -20 }, ...data.slice(4)];
        },
    },

    'numberAxis-preserveRatios': {
        options: {
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveRatios',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data, { x: 8, y: 50 }];
        },
        prependDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [{ x: -1, y: 50 }, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data.slice(0, 4), { x: 3.5, y: 50 }, ...data.slice(4)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['numberAxis-preserveRatios'].options;
            return [...data.slice(0, 4), { x: 3.5, y: -20 }, ...data.slice(4)];
        },
    },

    'ordinalTimeAxis-preserveDomain': {
        options: {
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveDomain',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: 30 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['ordinalTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
    },

    'ordinalTimeAxis-preserveRatios': {
        options: {
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveRatios',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: 50 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['ordinalTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
    },

    'continuousTimeAxis-preserveDomain': {
        options: {
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
                    type: 'area',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
            axes: {
                x: {
                    type: 'time',
                    position: 'bottom',
                    parentLevel: {
                        // Force more labels to show
                        enabled: true,
                    },
                    nice: false,
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveDomain',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: 20 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['continuousTimeAxis-preserveDomain'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
    },

    'continuousTimeAxis-preserveRatios': {
        options: {
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
                    type: 'area',
                    xKey: 'date',
                    yKey: 'value',
                },
            ],
            axes: {
                x: {
                    type: 'time',
                    position: 'bottom',
                    parentLevel: {
                        // Force more labels to show
                        enabled: true,
                    },
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
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
                onDataChange: {
                    strategy: 'preserveRatios',
                },
            },
        },
        appendDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-30'), value: 50 }; // Tuesday
            return [...data, datum];
        },
        prependDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-18'), value: 50 }; // Thursday
            return [datum, ...data];
        },
        insertMiddleDatum: () => {
            const { data } = meta['continuousTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: 50 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
        insertMiddleDatumNegative: () => {
            const { data } = meta['continuousTimeAxis-preserveRatios'].options;
            const datum = { date: new Date('2024-04-24'), value: -20 }; // Wednesday
            return [...data.slice(0, 3), datum, ...data.slice(3)];
        },
    },
};

// Interactive Version (for debugging): https://plnkr.co/edit/V0fHzpJXuYgpum7m?open=main.js
describe('Strategies', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    async function prepareChart<D>(meta: MetaEntry<D>): Promise<TestFixture<D>> {
        const zoomListener: ZoomListener<D> = newFreezableZoomListenerMock<D>();
        chart = AgCharts.create(
            prepareEnterpriseTestOptions({
                ...deepClone(meta.options), // `meta` is meant to be readonly.
                listeners: {
                    zoom: zoomListener.frozen,
                },
            })
        );
        await waitForChartStability(chart);
        return {
            meta,
            zoomListener,
            appendDatum: async (): Promise<void> => {
                await chart.updateDelta({ data: meta.appendDatum() });
                await waitForChartStability(chart);
            },
            prependDatum: async (): Promise<void> => {
                await chart.updateDelta({ data: meta.prependDatum() });
                await waitForChartStability(chart);
            },
            insertMiddleDatum: async (): Promise<void> => {
                await chart.updateDelta({ data: meta.insertMiddleDatum() });
                await waitForChartStability(chart);
            },
            insertMiddleDatumNegative: async (): Promise<void> => {
                await chart.updateDelta({ data: meta.insertMiddleDatumNegative() });
                await waitForChartStability(chart);
            },
        };
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('numberAxis-preserveDomain', () => {
        type TDatum = { x: number; y: number };
        let fixture: TestFixture<TDatum>;
        let initialRatioX: Pick<AgZoomEvent, 'ratioX'>;
        let initialRatioY: Pick<AgZoomEvent, 'ratioY'>;
        let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
        beforeEach(async () => {
            fixture = await prepareChart(meta['numberAxis-preserveDomain']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            initialRatioX = { ratioX: { start: zoom!.ratioX!.start!, end: zoom!.ratioX!.end! } };
            initialRatioY = { ratioY: { start: zoom!.ratioY!.start!, end: zoom!.ratioY!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ rangeX: { start: 2.5, end: 5.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioY);
        });
    });

    describe('numberAxis-preserveRatios', () => {
        type TDatum = { x: number; y: number };
        let fixture: TestFixture<TDatum>;
        let initialRangeX: Pick<AgZoomEvent, 'rangeX'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeX'>;
        let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
        beforeEach(async () => {
            fixture = await prepareChart(meta['numberAxis-preserveRatios']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            initialRangeX = { rangeX: { start: zoom!.rangeX!.start!, end: zoom!.rangeX!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
        });
    });

    describe('ordinalTimeAxis-preserveDomain', () => {
        type TDatum = { date: Date; value: number };
        let fixture: TestFixture<TDatum>;
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
                start: new Date(expectedRangeXSerialized.rangeX.start.value),
                end: new Date(expectedRangeXSerialized.rangeX.end.value),
            },
        } as const);

        beforeEach(async () => {
            fixture = await prepareChart(meta['ordinalTimeAxis-preserveDomain']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject(expectedRangeXSerialized);
            initialRatioX = { ratioX: { start: zoom!.ratioX!.start!, end: zoom!.ratioX!.end! } };
            initialRatioY = { ratioY: { start: zoom!.ratioY!.start!, end: zoom!.ratioY!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioY);
        });
    });

    describe('ordinalTimeAxis-preserveRatios', () => {
        type TDatum = { date: Date; value: number };
        let fixture: TestFixture<TDatum>;
        let initialRangeX: Pick<AgZoomEvent, 'rangeX'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeX'>;
        let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
        beforeEach(async () => {
            fixture = await prepareChart(meta['ordinalTimeAxis-preserveRatios']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            initialRangeX = { rangeX: { start: zoom!.rangeX!.start!, end: zoom!.rangeX!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).not.toMatchObject(initialRangeY); // it makes day 26 (value 50) visible
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.7 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
        });
    });

    describe('continuousTimeAxis-preserveDomain', () => {
        type TDatum = { date: Date; value: number };
        let fixture: TestFixture<TDatum>;
        let initialRatioX: Pick<AgZoomEvent, 'ratioX'>;
        let initialRatioY: Pick<AgZoomEvent, 'ratioY'>;
        let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
        const expectedRangeXSerialized = deepFreeze({
            rangeX: {
                start: { __type: 'date', value: '2024-04-23T00:00:00.000Z' },
                end: { __type: 'date', value: '2024-04-25T00:00:00.000Z' },
            },
        } as const);
        const expectedRangeX = deepFreeze({
            rangeX: {
                start: new Date(expectedRangeXSerialized.rangeX.start.value),
                end: new Date(expectedRangeXSerialized.rangeX.end.value),
            },
        } as const);

        beforeEach(async () => {
            fixture = await prepareChart(meta['continuousTimeAxis-preserveDomain']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject(expectedRangeXSerialized);
            initialRatioX = { ratioX: { start: zoom!.ratioX!.start!, end: zoom!.ratioX!.end! } };
            initialRatioY = { ratioY: { start: zoom!.ratioY!.start!, end: zoom!.ratioY!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).not.toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRatioY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject(expectedRangeXSerialized);
            expect(state.zoom).toMatchObject(initialRatioX);
            expect(state.zoom).toMatchObject(initialRatioY);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(expectedRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRatioY);
        });
    });

    describe('continuousTimeAxis-preserveRatios', () => {
        type TDatum = { date: Date; value: number };
        let fixture: TestFixture<TDatum>;
        let initialRangeX: Pick<AgZoomEvent, 'rangeX'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeX'>;
        let initialRangeY: Pick<AgZoomEvent, 'rangeY'> | Pick<NonNullable<AgChartState['zoom']>, 'rangeY'>;
        beforeEach(async () => {
            fixture = await prepareChart(meta['continuousTimeAxis-preserveRatios']);

            const { zoom } = chart.getState();
            expect(zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            initialRangeX = { rangeX: { start: zoom!.rangeX!.start!, end: zoom!.rangeX!.end! } };
            initialRangeY = { rangeY: { start: zoom!.rangeY!.start!, end: zoom!.rangeY!.end! } };

            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            fixture.zoomListener.mock.mockClear();
        });
        test('append datum', async () => {
            await fixture.appendDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
        });
        test('prepend datum', async () => {
            await fixture.prependDatum();
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).not.toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject(initialRangeY);
        });
        test('insert-middle datum', async () => {
            await fixture.insertMiddleDatum(); // Y-zoom unchanged
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(0);
        });
        test('insert-middle datum (negative)', async () => {
            await fixture.insertMiddleDatumNegative(); // Y-zoom changed
            const state = chart.getState();
            expect(state.zoom).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(state.zoom).toMatchObject(initialRangeX);
            expect(state.zoom).not.toMatchObject(initialRangeY);
            expect(fixture.zoomListener.mock).toBeCalledTimes(1);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioX: { start: 0.25, end: 0.75 } });
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeX);
            expect(fixture.zoomListener.mock.mock.calls[0][0]).not.toMatchObject(initialRangeY);
        });
    });
});
