import { type Mock, afterEach, describe, expect, it } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgDataSourceRequestSource,
    type AgNumberAxisOptions,
} from 'ag-charts-community';
import {
    clickAction,
    compareImageSnapshot,
    delay,
    expectWarningsCalls,
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { isDate } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

// Note: We set crosshair: { enabled: false } and tooltip: { range: 'exact'} to avoid the highlight
// styling from being rendered styling because there is a race condition with the clickAction and
// data-update handling, which sometimes triggers the highlight rendering, and sometimes doesn't. We're
// not explicitly testing highlight rendering, so this allows us to treat highlighted & unhighlighted
// charts as equal.
const BASE_OPTIONS: AgCartesianChartOptions = {
    tooltip: { range: 'exact' },
    dataSource: {
        // @ts-expect-error Set undocumented options to instantly resolve for tests
        requestThrottle: 0,
        updateThrottle: 0,
        updateDuringInteraction: true,
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
        minVisibleItems: 1,
    },
};

const TIME_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
        x: {
            type: 'time',
            position: 'bottom',
            min: new Date('2024-01-01 00:00:00'),
            max: new Date('2024-01-07 00:00:00'),
            crosshair: { enabled: false },
        },
    },
    series: [{ type: 'line', xKey: 'time', yKey: 'price' }],
};

const UNIT_TIME_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
        x: {
            type: 'unit-time',
            position: 'bottom',
            min: new Date('2024-01-01 00:00:00'),
            max: new Date('2024-02-12 00:00:00'),
            crosshair: { enabled: false },
        },
    },
    series: [{ type: 'line', xKey: 'time', yKey: 'price' }],
};

const ORDINAL_TIME_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            crosshair: { enabled: false },
        },
    },
    series: [{ type: 'line', xKey: 'time', yKey: 'price' }],
};

const NUMERIC_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        x: { type: 'number', position: 'bottom', crosshair: { enabled: false } },
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
    },
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

const CATEGORY_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        x: { type: 'category', position: 'bottom', crosshair: { enabled: false } },
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
    },
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

const GROUPED_CATEGORY_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        x: { type: 'grouped-category', position: 'bottom', crosshair: { enabled: false } },
        y: { type: 'number', position: 'left', crosshair: { enabled: false } },
    },
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

describe('DataSource', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(
        dataSourceOptions?: AgChartOptions['dataSource'],
        baseOptions: AgCartesianChartOptions = TIME_OPTIONS
    ) {
        const options: AgChartOptions = {
            ...baseOptions,
            dataSource: { ...baseOptions.dataSource, ...(dataSourceOptions ?? {}) } as AgChartOptions['dataSource'],
        };

        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, {});
    };

    // `scrollAction` dispatches a wheel event and then waits only a fixed delay. The zoom it
    // triggers commits on a later frame and re-requests data asynchronously, so under CPU load the
    // effect can land after that fixed wait — asserting straight away then reads stale state. Re-poll
    // chart stability until the observable effect is seen, bounded so a genuine failure still surfaces.
    const settleUntil = async (predicate: () => boolean, description: string) => {
        for (let attempt = 0; attempt < 200; attempt++) {
            await waitForChartStability(chart);
            if (predicate()) return;
            await delay(5);
        }
        throw new Error(`Timed out waiting for ${description}`);
    };

    it('should load data asynchronously', async () => {
        const response = delay(1).then(() => [
            { time: new Date('2024-01-01 00:00:00'), price: 0 },
            { time: new Date('2024-01-02 00:00:00'), price: 50 },
            { time: new Date('2024-01-03 00:00:00'), price: 25 },
            { time: new Date('2024-01-04 00:00:00'), price: 75 },
            { time: new Date('2024-01-05 00:00:00'), price: 50 },
            { time: new Date('2024-01-06 00:00:00'), price: 25 },
            { time: new Date('2024-01-07 00:00:00'), price: 50 },
        ]);
        await prepareChart({
            getData: () => response,
        });
        await response;
        await compare();
    });

    it('should clip asynchronous data outside domain', async () => {
        const response = delay(1).then(() => [
            { time: new Date('2024-01-01 00:00:00'), price: 0 },
            { time: new Date('2024-01-02 00:00:00'), price: 50 },
            { time: new Date('2024-01-03 00:00:00'), price: 25 },
            { time: new Date('2024-01-04 00:00:00'), price: 75 },
            { time: new Date('2024-01-05 00:00:00'), price: 50 },
            { time: new Date('2024-01-06 00:00:00'), price: 25 },
            { time: new Date('2024-01-07 00:00:00'), price: 50 },
        ]);
        await prepareChart(
            {
                getData: () => response,
            },
            {
                ...TIME_OPTIONS,
                axes: {
                    ...TIME_OPTIONS.axes!,
                    y: {
                        ...(TIME_OPTIONS.axes!.y! as AgNumberAxisOptions),
                        type: 'number',
                        min: 40,
                        max: 100,
                    },
                },
            }
        );
        await response;
        await compare();
    });

    describe('with window', () => {
        let response: Promise<Array<{ time: Date; price: number }>>;
        let dataSource: AgChartOptions['dataSource'];

        beforeEach(() => {
            response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-01 12:00:00'), price: 30 },
                { time: new Date('2024-01-02 00:00:00'), price: 50 },
                { time: new Date('2024-01-02 12:00:00'), price: 40 },
                { time: new Date('2024-01-03 00:00:00'), price: 25 },
                { time: new Date('2024-01-03 12:00:00'), price: 60 },
                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                { time: new Date('2024-01-04 12:00:00'), price: 60 },
                { time: new Date('2024-01-05 00:00:00'), price: 50 },
                { time: new Date('2024-01-05 12:00:00'), price: 30 },
                { time: new Date('2024-01-06 00:00:00'), price: 25 },
                { time: new Date('2024-01-06 12:00:00'), price: 40 },
                { time: new Date('2024-01-07 00:00:00'), price: 50 },
            ]);
            dataSource = {
                getData: async ({ windowStart, windowEnd }) => {
                    const day = 1000 * 60 * 60 * 24;
                    const data = await response;
                    return data.filter((d) => {
                        const time = d.time.getTime();
                        const isDay = time % day === 0;
                        const hasWindow =
                            isDate(windowStart) &&
                            isDate(windowEnd) &&
                            windowEnd.getTime() - windowStart.getTime() < day * 4;
                        const isWindow = hasWindow && time >= windowStart.getTime() && time <= windowEnd.getTime();
                        return isDay || isWindow;
                    });
                },
            };
        });

        it('should load a window at the end', async () => {
            await prepareChart(dataSource, {
                ...TIME_OPTIONS,
                initialState: { zoom: { ratioX: { start: 0.5, end: 1 } } },
            });
            await response;
            await compare();
        });

        it('should load a window in the middle', async () => {
            await prepareChart(dataSource, {
                ...TIME_OPTIONS,
                initialState: { zoom: { ratioX: { start: 0.25, end: 0.75 } } },
            });
            await response;
            await compare();
        });

        it('should change the window after a change in zoom', async () => {
            let callCount = 0;
            await prepareChart({
                getData: (window) => {
                    callCount++;
                    return dataSource!.getData(window);
                },
            });
            await response;
            await compare();

            // The wheel zoom commits a frame before the windowed data is re-requested and re-rendered;
            // wait for that fetch and let it settle, otherwise the snapshot can capture the pre-refetch
            // frame.
            const callsBeforeZoom = callCount;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => callCount > callsBeforeZoom, 'the zoom-triggered data request');
            await delay(1);
            await waitForChartStability(chart);
            await compare();
        });
    });

    describe('numeric data', () => {
        it('should load numeric data', async () => {
            const response = delay(1).then(() => [
                { x: 1, y: 0 },
                { x: 2, y: 50 },
                { x: 3, y: 25 },
                { x: 4, y: 75 },
                { x: 5, y: 50 },
                { x: 6, y: 25 },
                { x: 7, y: 50 },
            ]);
            await prepareChart({ getData: () => response }, NUMERIC_OPTIONS);
            await response;
            await compare();
        });
    });

    describe('category data', () => {
        it('should load category data', async () => {
            const response = delay(1).then(() => [
                { x: 'one', y: 0 },
                { x: 'two', y: 50 },
                { x: 'three', y: 25 },
                { x: 'four', y: 75 },
                { x: 'five', y: 50 },
                { x: 'six', y: 25 },
                { x: 'seven', y: 50 },
            ]);

            let windowStart: unknown;
            let windowEnd: unknown;

            await prepareChart(
                {
                    getData: (window) => {
                        windowStart = window.windowStart;
                        windowEnd = window.windowEnd;
                        return response;
                    },
                },
                CATEGORY_OPTIONS
            );

            await response;
            await compare();

            expect(windowStart).toEqual(undefined);
            expect(windowEnd).toEqual(undefined);

            const previousWindowStart = windowStart;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => windowStart !== previousWindowStart, 'the zoomed data window');

            expect(windowStart).toEqual('four');
            expect(windowEnd).toEqual('seven');
        });

        it('should load grouped category data', async () => {
            const response = delay(1).then(() => [
                { x: ['alpha', 'one'], y: 0 },
                { x: ['alpha', 'two'], y: 50 },
                { x: ['alpha', 'three'], y: 25 },
                { x: ['bravo', 'four'], y: 75 },
                { x: ['charlie', 'five'], y: 50 },
                { x: ['charlie', 'six'], y: 25 },
                { x: ['delta', 'seven'], y: 50 },
            ]);

            let windowStart: unknown;
            let windowEnd: unknown;
            await prepareChart(
                {
                    getData: (window) => {
                        windowStart = window.windowStart;
                        windowEnd = window.windowEnd;
                        return response;
                    },
                },
                GROUPED_CATEGORY_OPTIONS
            );

            await response;
            await compare();

            expect(windowStart).toEqual(undefined);
            expect(windowEnd).toEqual(undefined);

            const previousWindowStart = windowStart;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => windowStart !== previousWindowStart, 'the zoomed data window');

            expect(windowStart).toEqual(['bravo', 'four']);
            expect(windowEnd).toEqual(['delta', 'seven']);
        });
    });

    describe('unit time', () => {
        it('should load data with unit time axes', async () => {
            const response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-08 00:00:00'), price: 50 },
                { time: new Date('2024-01-15 00:00:00'), price: 25 },
                { time: new Date('2024-01-22 00:00:00'), price: 75 },
                { time: new Date('2024-01-29 00:00:00'), price: 50 },
                { time: new Date('2024-02-05 00:00:00'), price: 25 },
                { time: new Date('2024-02-12 00:00:00'), price: 50 },
            ]);

            let windowStart: unknown;
            let windowEnd: unknown;
            await prepareChart(
                {
                    getData: (window) => {
                        windowStart = window.windowStart;
                        windowEnd = window.windowEnd;
                        return response;
                    },
                },
                UNIT_TIME_OPTIONS
            );

            await response;
            await compare();

            expect(windowStart).toEqual(new Date('2024-01-01 00:00:00'));
            expect(windowEnd).toEqual(new Date('2024-02-01 00:00:00'));

            const previousWindowStart = windowStart;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => windowStart !== previousWindowStart, 'the zoomed data window');

            expect(windowStart).toEqual(new Date('2024-01-22 00:00:00'));
            expect(windowEnd).toEqual(new Date('2024-02-12 00:00:00'));
        });
    });

    describe('ordinal time', () => {
        it('should load data with ordinal time axes', async () => {
            const response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-08 00:00:00'), price: 50 },
                { time: new Date('2024-01-15 00:00:00'), price: 25 },
                { time: new Date('2024-01-22 00:00:00'), price: 75 },
                { time: new Date('2024-01-29 00:00:00'), price: 50 },
                { time: new Date('2024-02-05 00:00:00'), price: 25 },
                { time: new Date('2024-02-12 00:00:00'), price: 50 },
            ]);

            let windowStart: unknown;
            let windowEnd: unknown;
            await prepareChart(
                {
                    getData: (window) => {
                        windowStart = window.windowStart;
                        windowEnd = window.windowEnd;
                        return response;
                    },
                },
                ORDINAL_TIME_OPTIONS
            );

            await response;
            await compare();

            expect(windowStart).toEqual(undefined);
            expect(windowEnd).toEqual(undefined);

            const previousWindowStart = windowStart;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => windowStart !== previousWindowStart, 'the zoomed data window');

            expect(windowStart).toEqual(new Date('2024-01-22 00:00:00'));
            expect(windowEnd).toEqual(new Date('2024-02-12 00:00:00'));
        });
    });

    describe('source parameter', () => {
        let sources: Array<AgDataSourceRequestSource | undefined>;

        async function prepareWithSourceCapture() {
            sources = [];
            const response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-02 00:00:00'), price: 50 },
                { time: new Date('2024-01-03 00:00:00'), price: 25 },
                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                { time: new Date('2024-01-05 00:00:00'), price: 50 },
                { time: new Date('2024-01-06 00:00:00'), price: 25 },
                { time: new Date('2024-01-07 00:00:00'), price: 50 },
            ]);
            await prepareChart({
                getData: ({ source }) => {
                    sources.push(source);
                    return response;
                },
            });
            await response;
            await waitForChartStability(chart);
        }

        it('reports a non-user source on the initial render', async () => {
            await prepareWithSourceCapture();

            expect(sources.length).toBeGreaterThan(0);
            expect(sources).not.toContain('user-interaction');
            expect(sources).toContain('chart-update');
        });

        it('reports a non-user source for a programmatic refresh', async () => {
            await prepareWithSourceCapture();
            sources.length = 0;

            await chart.updateDelta({});
            await settleUntil(() => sources.includes('chart-update'), 'the programmatic-refresh data request');
            await waitForChartStability(chart);

            expect(sources).toContain('chart-update');
            expect(sources).not.toContain('user-interaction');
        });

        it('reports a user-interaction source for a zoom triggered by user input', async () => {
            await prepareWithSourceCapture();
            sources.length = 0;

            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => sources.includes('user-interaction'), 'a user-interaction data request');
            await waitForChartStability(chart);

            expect(sources).toContain('user-interaction');
        });

        it('reports a state-change source for a programmatic setState', async () => {
            await prepareWithSourceCapture();

            // Capture a zoomed state to restore later, then zoom to a different level so the
            // restore is a genuine change that re-triggers a fetch.
            sources.length = 0;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => sources.includes('user-interaction'), 'the first user zoom request');
            await waitForChartStability(chart);
            const zoomedState = chart.getState();

            sources.length = 0;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => sources.includes('user-interaction'), 'the second user zoom request');
            await waitForChartStability(chart);
            sources.length = 0;

            await chart.setState(zoomedState);
            await settleUntil(() => sources.includes('state-change'), 'the state-change data request');
            await waitForChartStability(chart);

            expect(sources).toContain('state-change');
        });
    });

    describe('invalid response recovery', () => {
        // A response that renders no data must be retained-not-rendered just like a non-array
        // response — otherwise it would blank the chart to the no-data overlay. Only a non-array is a
        // developer error that warrants a warning; every array (empty, primitives, all-null rows, or
        // rows whose keys do not match the series) is structurally valid and is retained silently when
        // it renders nothing.
        it.each([
            ['a non-array response', undefined as any, true],
            ['an empty array', [], false],
            ['an array of primitives (wrong shape)', [1, 2, 3], false],
            ['an array of all-null-value objects (null fields)', [{ time: null, price: null }], false],
            // Renderable-shaped objects whose keys do not match the series (`time`/`price`) are
            // dispatched but render nothing post-process; the chart must retain the previous data and
            // stay re-requestable.
            [
                'an array of renderable objects with wrong keys',
                [
                    { x: 1, y: 2, label: 'Point A' },
                    { x: 2, y: 4, label: 'Point B' },
                ],
                false,
            ],
        ])(
            'retains the previous render on %s and recovers on the next zoom',
            async (_label, invalidResponse, expectArrayWarning) => {
                const validData = [
                    { time: new Date('2024-01-01 00:00:00'), price: 0 },
                    { time: new Date('2024-01-02 00:00:00'), price: 50 },
                    { time: new Date('2024-01-03 00:00:00'), price: 25 },
                    { time: new Date('2024-01-04 00:00:00'), price: 75 },
                    { time: new Date('2024-01-05 00:00:00'), price: 50 },
                    { time: new Date('2024-01-06 00:00:00'), price: 25 },
                    { time: new Date('2024-01-07 00:00:00'), price: 50 },
                ];

                let callCount = 0;
                let resolveInitial!: (data: typeof validData) => void;
                const initialResponse = new Promise<typeof validData>((resolve) => {
                    resolveInitial = resolve;
                });
                await prepareChart({
                    getData: () => {
                        callCount++;
                        // First (initial) request: deferred valid data (so we can capture the blank
                        // loading state first). Next request (the first zoom): invalid. Any later
                        // request (the recovery zoom): valid again.
                        if (callCount === 1) return initialResponse;
                        const data = callCount === 2 ? invalidResponse : validData;
                        return delay(1).then(() => data);
                    },
                });

                // Anti-vacuous baseline: the canvas while the initial request is still pending.
                const blank = extractImageData(ctx);

                resolveInitial(validData);
                await delay(1);
                await waitForChartStability(chart);

                const preError = extractImageData(ctx);
                // The rendered data state must differ from the blank/loading canvas.
                expect(preError.equals(blank)).toBe(false);

                // A user zoom that triggers the invalid response.
                const callsBeforeError = callCount;
                await scrollAction(cx, cy, -1)(chart);
                await settleUntil(() => callCount > callsBeforeError, 'the invalid-response request from the zoom');
                await delay(1);
                await waitForChartStability(chart);

                // The chart keeps its retained data rather than blanking out on the invalid response.
                // The blank/loading comparison only proves the axes/navigator still draw; the series
                // retaining renderable data is the load-bearing check (wrong-keyed rows are a valid
                // array but render nothing, so only this catches their post-process blanking).
                const postError = extractImageData(ctx);
                expect(postError.equals(blank)).toBe(false);
                expect(chart.chart.series.every((series: { hasData: boolean }) => series.hasData)).toBe(true);

                const warnCalls = (console.warn as Mock).mock.calls;
                const invalidValueWarnings = warnCalls.filter(
                    ([message]) =>
                        typeof message === 'string' &&
                        message.includes('[dataSource.getData] returned an invalid value')
                );
                expect(invalidValueWarnings).toHaveLength(expectArrayWarning ? 1 : 0);
                // Drain the remaining warnings so setupMockConsole's afterEach does not fail.
                expectWarningsCalls();

                // A subsequent user zoom recovers with a valid response and re-renders, proving the
                // failed request did not wedge zoom/pan (the re-zoom re-issues the request).
                const callsBeforeRecovery = callCount;
                await scrollAction(cx, cy, -1)(chart);
                await settleUntil(() => callCount > callsBeforeRecovery, 'the recovery request from the second zoom');
                await delay(1);
                await waitForChartStability(chart);

                const recovered = extractImageData(ctx);
                expect(recovered.equals(postError)).toBe(false);
            }
        );
    });

    describe('financial chart zoom preservation', () => {
        // A response that collapses the domain to a single band (zero span) must not corrupt the zoom.
        it('retains data and zoom when an unrenderable response collapses the domain', async () => {
            const validData = Array.from({ length: 40 }, (_, i) => ({
                date: new Date(2024, 0, 1 + i),
                open: 100 + i,
                high: 105 + i,
                low: 95 + i,
                close: 102 + i,
                volume: 1000 + i * 10,
            }));
            // The valid `date` keeps `hasData` non-trivial; the OHLC values are all non-finite.
            const malformed = [
                { date: 'not-a-date', open: 'abc', high: null, low: undefined, close: 103, volume: 1500000 },
                {
                    date: new Date(2024, 0, 3),
                    open: Number.NaN,
                    high: Number.POSITIVE_INFINITY,
                    low: Number.NEGATIVE_INFINITY,
                    close: 106,
                    volume: 1800000,
                },
                { wrongKey: 'value' },
                {},
            ];

            let scenario: 'valid' | 'malformed' = 'valid';
            let callCount = 0;
            const finOptions: any = {
                width: 800,
                height: 600,
                toolbar: false,
                statusBar: false,
                dataSource: {
                    requestThrottle: 0,
                    updateThrottle: 0,
                    updateDuringInteraction: true,
                    getData: () => {
                        callCount++;
                        return delay(1).then(() => (scenario === 'malformed' ? malformed : validData));
                    },
                },
            };
            prepareEnterpriseTestOptions(finOptions);
            cx = finOptions.width / 2;
            cy = finOptions.height / 2;
            chart = AgCharts.createFinancialChart(finOptions);
            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
            await delay(1);
            await waitForChartStability(chart);

            const callsBeforeZoom = callCount;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(() => callCount > callsBeforeZoom, 'the first zoom request');
            await delay(1);
            await waitForChartStability(chart);
            const zoomBefore = chart.getState().zoom!.ratioX!;
            expect(zoomBefore.start).toBeGreaterThan(0); // anti-vacuous: baseline is zoomed in

            scenario = 'malformed';
            const callsBeforeMalformed = callCount;
            await scrollAction(cx, cy, -1)(chart);
            await settleUntil(
                () => callCount > callsBeforeMalformed,
                'the malformed-response request from the second zoom'
            );
            await delay(1);
            await waitForChartStability(chart);

            const zoomAfter = chart.getState().zoom!.ratioX!;
            expect(Number.isFinite(zoomAfter.start)).toBe(true);
            expect(Number.isFinite(zoomAfter.end)).toBe(true);
            expect(zoomAfter.start).toBeGreaterThanOrEqual(zoomBefore.start);
            // Retained, not committed: the previous render survives.
            expect(chart.chart.series.every((series: { hasData: boolean }) => series.hasData)).toBe(true);

            expectWarningsCalls(); // drain value-validation warnings
        });
    });

    describe('navigator mini-chart', () => {
        it('should use separate data for mini-chart', async () => {
            const response = delay(1).then(() => [
                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                { time: new Date('2024-01-02 00:00:00'), price: 50 },
                { time: new Date('2024-01-03 00:00:00'), price: 25 },
                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                { time: new Date('2024-01-05 00:00:00'), price: 50 },
                { time: new Date('2024-01-06 00:00:00'), price: 25 },
                { time: new Date('2024-01-07 00:00:00'), price: 50 },
            ]);
            await prepareChart(
                {
                    getData: async ({ source }) => {
                        await delay(1);
                        if (source === 'mini-chart') {
                            return [
                                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                                { time: new Date('2024-01-07 00:00:00'), price: 50 },
                            ];
                        } else {
                            return [
                                { time: new Date('2024-01-01 00:00:00'), price: 0 },
                                { time: new Date('2024-01-02 00:00:00'), price: 50 },
                                { time: new Date('2024-01-03 00:00:00'), price: 25 },
                                { time: new Date('2024-01-04 00:00:00'), price: 75 },
                                { time: new Date('2024-01-05 00:00:00'), price: 50 },
                                { time: new Date('2024-01-06 00:00:00'), price: 25 },
                                { time: new Date('2024-01-07 00:00:00'), price: 50 },
                            ];
                        }
                    },
                },
                {
                    ...TIME_OPTIONS,
                    navigator: {
                        miniChart: {
                            enabled: true,
                        },
                    },
                }
            );
            await response;
            await compare();
        });
    });
});
