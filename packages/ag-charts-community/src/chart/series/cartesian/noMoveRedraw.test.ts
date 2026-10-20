import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    countRectsMarkedDirty,
    deproxy,
    expectNonBlank,
    getSeriesAggregationInternals,
    measureRedrawWork,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from '../../test/utils';

type Datum = { category: string; value: number };

function makeData(count: number, shift = 0): Datum[] {
    return Array.from({ length: count }, (_, i) => {
        const value = 10 + ((i + shift) % 17);
        return { category: `C${i}`, value: i % 3 === 0 ? -value / 2 : value };
    });
}

describe('BarSeries redraw where nothing moves', () => {
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    async function createBarChart(count: number, extra: Partial<AgCartesianChartOptions> = {}) {
        const data = makeData(count);
        const options: AgCartesianChartOptions = prepareTestOptions({
            data,
            animation: { enabled: false },
            title: { text: 'Bars' },
            legend: { enabled: false },
            series: [{ type: 'bar', xKey: 'category', yKey: 'value', fill: '#2e86de' }],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            ...extra,
        });
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        return { chart, data };
    }

    // Crisp bars are first drawn snapped to device pixels, and the first redraw writes back their exact geometry. Pixels
    // stay identical, but the rects' paths are rebuilt once, so measure from the second.
    async function settle(c: AgChartInstance, count: number) {
        await c.updateDelta({ data: makeData(count) });
        await waitForChartStability(c);
    }

    const barHeights = () =>
        (getSeriesAggregationInternals(chart!).contextNodeData?.nodeData as { height: number }[]).map((d) => d.height);

    it('rebuilds nothing for a title change', async () => {
        const { chart: c } = await createBarChart(200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ title: { text: 'Other' } }));

        expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
    });

    it('redraws when the data moves', async () => {
        const { chart: c } = await createBarChart(200);
        const before = ctx.snapshot();

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200, 1) }));

        expect(work.nodeDataBuilds).toBe(1);
        expect(work.rectPathBuilds).toBeGreaterThan(0);
        (expect(ctx.snapshot()) as any).not.toMatchImage(before, { writeDiff: false });
    });

    it('redraws when the data array is mutated in place', async () => {
        const { chart: c, data } = await createBarChart(200);
        const heightBefore = barHeights()[5];

        data[5].value += 7;
        const work = await measureRedrawWork(c, () => c.updateDelta({ data }));

        expect(work.nodeDataBuilds).toBe(1);
        expect(barHeights()[5]).not.toBe(heightBefore);
    });

    it('redraws when the data array is replaced by one holding a changed value', async () => {
        const { chart: c } = await createBarChart(200);
        const next = makeData(200);
        next[199] = { ...next[199], value: 50 };

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

        expect(work.nodeDataBuilds).toBe(1);
    });

    it('leaves the segments of the bar layer alone when an itemStyler rebuilds identical node data', async () => {
        const { chart: c } = await createBarChart(200, {
            series: [{ type: 'bar', xKey: 'category', yKey: 'value', itemStyler: () => ({ fill: '#2e86de' }) }],
        });
        await settle(c, 200);
        const { dataNodeGroup } = deproxy(c).series[0] as any;
        const segments = dataNodeGroup.segments;

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200) }));

        expect(work.nodeDataBuilds).toBe(1);
        expect(dataNodeGroup.segments).toBe(segments);
    });

    describe('leaves the bar layer clean', () => {
        it('for identical data', async () => {
            const { chart: c } = await createBarChart(200);
            await settle(c, 200);

            expect(await countRectsMarkedDirty(c, () => c.updateDelta({ data: makeData(200) }))).toBe(0);
        });

        it('but not for data that moves', async () => {
            const { chart: c } = await createBarChart(200);
            await settle(c, 200);

            expect(await countRectsMarkedDirty(c, () => c.updateDelta({ data: makeData(200, 1) }))).toBeGreaterThan(0);
        });
    });
});

describe('BarSeries redraw matches a fresh render', () => {
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // Few enough bars for their fills to show between the strokes.
    const COUNT = 30;
    const LONG_TITLE = 'A much longer title than the one the chart started with';

    const BASE_SERIES = {
        type: 'bar',
        xKey: 'category',
        yKey: 'value',
        fill: '#2e86de',
        stroke: '#222222',
        strokeWidth: 2,
    } as const;

    function options(overrides: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions {
        return prepareTestOptions({
            data: makeData(COUNT),
            animation: { enabled: false },
            title: { text: 'Bars' },
            legend: { enabled: false },
            series: [BASE_SERIES],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            ...overrides,
        } as AgCartesianChartOptions);
    }

    /** Renders `target` fresh, then updates the same chart to `start` and applies `delta` on top. */
    async function applyDelta(target: AgCartesianChartOptions, start: AgCartesianChartOptions, delta: object) {
        chart = AgCharts.create(target);
        await waitForChartStability(chart);
        const expected = ctx.snapshot();

        await chart.update(start);
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        await chart.updateDelta(delta);
        await waitForChartStability(chart);
        return { expected, started, actual: ctx.snapshot() };
    }

    it('applies a title change to the same pixels as a fresh render', async () => {
        const { expected, started, actual } = await applyDelta(options({ title: { text: LONG_TITLE } }), options(), {
            title: { text: LONG_TITLE },
        });

        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('moves the bars to the same pixels as a fresh render', async () => {
        const { expected, started, actual } = await applyDelta(options({ data: makeData(COUNT, 5) }), options(), {
            data: makeData(COUNT, 5),
        });

        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('hides and shows the series again at the same pixels', async () => {
        chart = AgCharts.create(options());
        await waitForChartStability(chart);
        const c = chart;
        const expected = ctx.snapshot();

        await c.updateDelta({ series: [{ ...BASE_SERIES, visible: false }] });
        await waitForChartStability(c);
        expect(ctx.snapshot()).not.toMatchImage(expected, { writeDiff: false });

        await c.updateDelta({ series: [{ ...BASE_SERIES, visible: true }] });
        await waitForChartStability(c);
        expect(ctx.snapshot()).toMatchImage(expected);
    });

    describe('stacked bars past 1000 rows', () => {
        const ROWS = 1200;
        type Stacked = { category: string; a: number; b: number };

        const stackedRows = (a: number, b: number): Stacked[] =>
            Array.from({ length: ROWS }, (_, i) => ({ category: `C${i}`, a, b }));

        const stackedOptions = (data: Stacked[]) =>
            prepareTestOptions({
                data,
                animation: { enabled: false },
                title: { text: 'Stacked' },
                legend: { enabled: false },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'a', stacked: true },
                    { type: 'bar', xKey: 'category', yKey: 'b', stacked: true },
                ],
                axes: { x: { type: 'category' }, y: { type: 'number' } },
            } as AgCartesianChartOptions);

        it('moves a segment boundary whose stack total stays fixed', async () => {
            chart = AgCharts.create(stackedOptions(stackedRows(3, 5)));
            await waitForChartStability(chart);
            const c = chart;

            await c.updateDelta({ data: stackedRows(5, 3) });
            await waitForChartStability(c);
            await c.updateDelta({ data: stackedRows(4, 4) });
            await waitForChartStability(c);
            const moved = ctx.snapshot();
            expectNonBlank(moved);

            // Hiding the title and showing it again shifts the series area, so every rect is rebuilt.
            await c.updateDelta({ title: { enabled: false } });
            await waitForChartStability(c);
            await c.updateDelta({ title: { enabled: true } });
            await waitForChartStability(c);

            expect(moved).toMatchImage(ctx.snapshot());
        });
    });
});
