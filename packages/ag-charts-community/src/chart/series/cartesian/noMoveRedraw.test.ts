import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Node, Rect } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    clickAction,
    deproxy,
    expectNonBlank,
    getBarSeriesKeptInternals,
    getSeriesAggregationInternals,
    hoverAction,
    measureRedrawWork,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from '../../test/utils';

type Datum = { category: string; value: number; note: string };

function makeData(count: number, shift = 0, note = 'a'): Datum[] {
    return Array.from({ length: count }, (_, i) => {
        const value = 10 + ((i + shift) % 17);
        return { category: `C${i}`, value: i % 3 === 0 ? -value / 2 : value, note };
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
    const nodeCount = () => getSeriesAggregationInternals(chart!).contextNodeData?.nodeData?.length ?? 0;

    it('rebuilds nothing for the same data in a new array', async () => {
        const { chart: c } = await createBarChart(200);
        await settle(c, 200);
        const before = ctx.snapshot();

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200) }));

        expect(nodeCount()).toBe(200);
        expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
        expect(ctx.snapshot()).toMatchImage(before);
    });

    it('rebuilds nothing for the same data over and over', async () => {
        const { chart: c } = await createBarChart(200);
        await settle(c, 200);

        for (let i = 0; i < 3; i++) {
            const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200) }));
            expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
        }
    });

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

    it('redraws when the number of rows changes', async () => {
        const { chart: c } = await createBarChart(200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(199) }));

        expect(work.nodeDataBuilds).toBe(1);
        expect(nodeCount()).toBe(199);
    });

    it('hands tooltips the new datum when a field no series key reads changes', async () => {
        const { chart: c } = await createBarChart(50);

        const next = makeData(50, 0, 'b');
        const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

        expect(work.nodeDataBuilds).toBe(1);
        const nodeData = getSeriesAggregationInternals(c).contextNodeData?.nodeData as { datum: Datum }[];
        expect(nodeData.every((d) => d.datum.note === 'b')).toBe(true);
    });

    it('redraws once the data moves after a redraw that did not', async () => {
        const { chart: c } = await createBarChart(200);
        await settle(c, 200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200, 3) }));

        expect(work.nodeDataBuilds).toBe(1);
    });

    it('redraws when the data does not move but the series changes', async () => {
        const { chart: c } = await createBarChart(200);

        const work = await measureRedrawWork(c, () =>
            c.updateDelta({
                data: makeData(200),
                series: [{ type: 'bar', xKey: 'category', yKey: 'value', fill: '#e67e22', cornerRadius: 4 }],
            })
        );

        expect(work.nodeDataBuilds).toBe(1);
    });

    it('rebuilds nothing when the only callbacks are a tooltip renderer and listeners', async () => {
        const { chart: c } = await createBarChart(200, {
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                    fill: '#2e86de',
                    tooltip: { renderer: () => 'tip' },
                    listeners: { seriesNodeClick: () => {} },
                },
            ],
        });
        await settle(c, 200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200) }));

        expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
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

    const nodeDatums = () =>
        getSeriesAggregationInternals(chart!).contextNodeData?.nodeData as { datum: Datum; datumIndex: number }[];

    it('hands the node data the rows of the latest data after a redraw that did not move anything', async () => {
        const { chart: c } = await createBarChart(50);
        await settle(c, 50);

        const next = makeData(50);
        const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

        expect(work.nodeDataBuilds).toBe(0);
        expect(nodeDatums().every((d) => d.datum === next[d.datumIndex])).toBe(true);
    });

    it('keeps handing the node data the rows the user edits in place after an equal replacement', async () => {
        const { chart: c } = await createBarChart(50);
        await settle(c, 50);
        const next = makeData(50);
        await c.updateDelta({ data: next });
        await waitForChartStability(c);

        for (const row of next) row.note = 'edited';
        const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

        expect(work.nodeDataBuilds).toBe(0);
        expect(nodeDatums().every((d) => d.datum === next[d.datumIndex] && d.datum.note === 'edited')).toBe(true);
    });

    it('fires seriesNodeClick with the row object the user passed after an equal replacement', async () => {
        const clicked: unknown[] = [];
        const { chart: c } = await createBarChart(5, {
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                    listeners: { seriesNodeClick: (event: { datum: unknown }) => clicked.push(event.datum) },
                } as any,
            ],
        });
        await settle(c, 5);
        const next = makeData(5);
        await c.updateDelta({ data: next });
        await waitForChartStability(c);

        const { seriesRect } = deproxy(c);
        const bar = (nodeDatums() as unknown as { x: number; y: number; width: number; height: number }[])[1];
        await clickAction(seriesRect!.x + bar.x + bar.width / 2, seriesRect!.y + bar.y + bar.height / 2)(c);
        await waitForChartStability(c);

        expect(clicked).toHaveLength(1);
        expect(clicked[0]).toBe(next[1]);
    });

    describe('leaves the bar layer clean', () => {
        /** A bar marked dirty is what makes its layer rasterise again. */
        async function countBarsMarkedDirty(c: AgChartInstance, update: () => Promise<void>) {
            const spy = vi.spyOn(Node.prototype, 'markDirty');
            try {
                await update();
                await waitForChartStability(c);
                return spy.mock.contexts.filter((node) => node instanceof Rect).length;
            } finally {
                spy.mockRestore();
            }
        }

        it('for identical data whose node data is kept', async () => {
            const { chart: c } = await createBarChart(200);
            await settle(c, 200);

            expect(await countBarsMarkedDirty(c, () => c.updateDelta({ data: makeData(200) }))).toBe(0);
        });

        it('for identical data whose node data is rebuilt', async () => {
            const { chart: c } = await createBarChart(200, {
                series: [{ type: 'bar', xKey: 'category', yKey: 'value', itemStyler: () => ({ fill: '#2e86de' }) }],
            });
            await settle(c, 200);

            const rebuilds = (await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200) }))).nodeDataBuilds;
            expect(rebuilds).toBe(1);
            expect(await countBarsMarkedDirty(c, () => c.updateDelta({ data: makeData(200) }))).toBe(0);
        });

        it('but not for data that moves', async () => {
            const { chart: c } = await createBarChart(200);
            await settle(c, 200);

            expect(await countBarsMarkedDirty(c, () => c.updateDelta({ data: makeData(200, 1) }))).toBeGreaterThan(0);
        });
    });

    it('does not keep earlier generations of processed data alive', async () => {
        v8.setFlagsFromString('--expose-gc');
        const gc = vm.runInNewContext('gc') as () => void;
        const { chart: c } = await createBarChart(200);
        const series = deproxy(c).series[0] as any;

        const generations: WeakRef<object>[] = [];
        for (let i = 0; i < 8; i++) {
            await c.updateDelta({ data: makeData(200) });
            await waitForChartStability(c);
            generations.push(new WeakRef(series.processedData));
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
        gc();

        expect(generations.filter((generation) => generation.deref() != null).length).toBeLessThanOrEqual(2);
    });

    it('redraws when the data does not move but the chart resizes', async () => {
        const { chart: c } = await createBarChart(200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200), width: 500 }));

        expect(work.nodeDataBuilds).toBe(1);
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

    function options(overrides: Partial<AgCartesianChartOptions> = {}, series: object = {}): AgCartesianChartOptions {
        return prepareTestOptions({
            data: makeData(COUNT),
            animation: { enabled: false },
            title: { text: 'Bars' },
            legend: { enabled: false },
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'value',
                    fill: '#2e86de',
                    stroke: '#222222',
                    strokeWidth: 2,
                    ...series,
                },
            ],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            ...overrides,
        } as AgCartesianChartOptions);
    }

    /**
     * Renders `target` fresh, then updates the same chart to `start` and applies `delta` on top. The chart must end
     * up where the fresh render was, whichever way the update was cut short. Only the final delta is measured.
     */
    async function applyDelta(target: AgCartesianChartOptions, start: AgCartesianChartOptions, delta: object) {
        chart = AgCharts.create(target);
        await waitForChartStability(chart);
        const expected = ctx.snapshot();

        await chart.update(start);
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        const work = await measureRedrawWork(chart, () => chart!.updateDelta(delta));
        return { expected, started, actual: ctx.snapshot(), work };
    }

    const BASE_SERIES = {
        type: 'bar',
        xKey: 'category',
        yKey: 'value',
        fill: '#2e86de',
        stroke: '#222222',
        strokeWidth: 2,
    } as const;

    it.each([
        ['fill', { fill: '#e67e22' }],
        ['fillOpacity', { fillOpacity: 0.4 }],
        ['stroke', { stroke: '#c0392b' }],
        ['strokeOpacity', { strokeOpacity: 0.3 }],
        ['lineDash', { lineDash: [4, 2] }],
    ])('restyles without rebuilding for a colour-only change to %s', async (_name, style) => {
        const { expected, started, actual, work } = await applyDelta(options({}, style), options({}, {}), {
            series: [{ ...BASE_SERIES, ...style }],
        });

        expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('shows the new colour when the bars are restyled over and over', async () => {
        chart = AgCharts.create(options({}, { fill: '#8e44ad' }));
        await waitForChartStability(chart);
        const expected = ctx.snapshot();
        expectNonBlank(expected);

        await chart.update(options());
        await waitForChartStability(chart);
        const started = ctx.snapshot();
        const c = chart;

        for (const fill of ['#e67e22', '#27ae60', '#8e44ad']) {
            const work = await measureRedrawWork(c, () => c.updateDelta({ series: [{ ...BASE_SERIES, fill }] }));
            expect(work.nodeDataBuilds).toBe(0);
        }
        const actual = ctx.snapshot();

        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('applies a title change to the same pixels as a fresh render', async () => {
        const { expected, started, actual, work } = await applyDelta(
            options({ title: { text: LONG_TITLE } }),
            options(),
            { title: { text: LONG_TITLE } }
        );

        expect(work.nodeDataBuilds).toBe(0);
        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('moves the bars to the same pixels as a fresh render', async () => {
        const { expected, started, actual, work } = await applyDelta(options({ data: makeData(COUNT, 5) }), options(), {
            data: makeData(COUNT, 5),
        });

        expect(work.nodeDataBuilds).toBe(1);
        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    });

    it('moves the bars when the same data is followed by new data and a colour change together', async () => {
        const { expected, actual } = await applyDelta(
            options({ data: makeData(COUNT, 2) }, { fill: '#27ae60' }),
            options(),
            { data: makeData(COUNT, 2), series: [{ ...BASE_SERIES, fill: '#27ae60' }] }
        );

        expect(actual).toMatchImage(expected);
    });

    it('rebuilds when a colour changes with something that moves the bars', async () => {
        const target = options({}, { fill: '#27ae60', cornerRadius: 6 });
        const { expected, actual, work } = await applyDelta(target, options(), {
            series: [{ ...BASE_SERIES, fill: '#27ae60', cornerRadius: 6 }],
        });

        expect(work.nodeDataBuilds).toBe(1);
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

    /**
     * For a callback that reads state outside the options. Renders fresh with the state at `to`, moves the same chart
     * back to `from`, flips the state and applies `delta`: the chart has to end where the fresh render was.
     */
    async function expectFollowsState(
        make: (read: () => string, fill?: string) => AgCartesianChartOptions,
        delta: (read: () => string) => object,
        { from = 'a', to = 'bb', fill }: { from?: string; to?: string; fill?: string } = {}
    ) {
        let state = to;
        const read = () => state;
        chart = AgCharts.create(make(read, fill));
        await waitForChartStability(chart);
        const expected = ctx.snapshot();
        expectNonBlank(expected);

        state = from;
        await chart.update(make(read));
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        state = to;
        const c = chart;
        const work = await measureRedrawWork(c, () => c.updateDelta(delta(read)));
        const actual = ctx.snapshot();

        expect(work.nodeDataBuilds).toBe(1);
        expect(actual).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    }

    it('re-runs an itemStyler that now returns something else, for the same data', async () => {
        await expectFollowsState(
            (read) => options({}, { fill: undefined, itemStyler: () => ({ fill: read() }) }),
            () => ({ data: makeData(COUNT) }),
            { from: '#2e86de', to: '#c0392b' }
        );
    });

    it('re-runs a label formatter that now returns something else, for the same data', async () => {
        const label = (read: () => string) => ({
            enabled: true,
            formatter: ({ value }: { value: number }) => `${value}${read()}`,
        });
        await expectFollowsState(
            (read) => options({}, { label: label(read) }),
            () => ({ data: makeData(COUNT) })
        );
    });

    describe('callbacks outside the series options that feed the labels', () => {
        const labelled = { label: { enabled: true } };

        it('re-runs a chart formatter that now returns something else, for the same data', async () => {
            await expectFollowsState(
                (read) => options({ formatter: ({ value }: any) => `${value}${read()}` } as any, labelled),
                () => ({ data: makeData(COUNT) }),
                { to: 'b' }
            );
        });

        it('re-runs an axis label formatter that now returns something else, for the same data', async () => {
            await expectFollowsState(
                (read) =>
                    options(
                        {
                            axes: {
                                x: { type: 'category' },
                                y: { type: 'number', label: { formatter: ({ value }: any) => `${value}${read()}` } },
                            },
                        },
                        labelled
                    ),
                () => ({ data: makeData(COUNT) }),
                { to: 'b' }
            );
        });

        it('re-runs a chart formatter that now returns something else, alongside a colour change', async () => {
            await expectFollowsState(
                (read, fill) =>
                    options({ formatter: ({ value }: any) => `${value}${read()}` } as any, {
                        ...labelled,
                        ...(fill == null ? {} : { fill }),
                    }),
                () => ({ series: [{ ...BASE_SERIES, ...labelled, fill: '#e67e22' }] }),
                { to: 'b', fill: '#e67e22' }
            );
        });
    });

    it('draws stacked bars where the same data and moved data would put them', async () => {
        const stacked = (data: Datum[]) =>
            prepareTestOptions({
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'value', stacked: true },
                    { type: 'bar', xKey: 'category', yKey: 'other', stacked: true },
                ],
                axes: { x: { type: 'category' }, y: { type: 'number' } },
            } as AgCartesianChartOptions);
        const rows = (shift: number) =>
            makeData(COUNT, shift).map((d) => ({ ...d, value: Math.abs(d.value), other: 5 }));

        chart = AgCharts.create(stacked(rows(4)));
        await waitForChartStability(chart);
        const expected = ctx.snapshot();

        await chart.update(stacked(rows(0)));
        await waitForChartStability(chart);
        await chart.updateDelta({ data: rows(0) });
        await waitForChartStability(chart);
        await chart.updateDelta({ data: rows(4) });
        await waitForChartStability(chart);

        expect(ctx.snapshot()).toMatchImage(expected);
    });

    it('keeps the bars of a time axis whose dates are new objects holding the same times', async () => {
        const rows = (shift = 0) =>
            Array.from({ length: 40 }, (_, i) => ({ date: new Date(2024, 0, i + 1), value: 5 + ((i + shift) % 11) }));
        const timeOptions = (data: object[]) =>
            prepareTestOptions({
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
                axes: { x: { type: 'time' }, y: { type: 'number' } },
            } as AgCartesianChartOptions);

        chart = AgCharts.create(timeOptions(rows(3)));
        await waitForChartStability(chart);
        const expected = ctx.snapshot();

        await chart.update(timeOptions(rows()));
        await waitForChartStability(chart);
        await chart.updateDelta({ data: rows() });
        await waitForChartStability(chart);
        await chart.updateDelta({ data: rows(3) });
        await waitForChartStability(chart);

        expect(ctx.snapshot()).toMatchImage(expected);
    });
});

describe('BarSeries redraw keeps node data only while every input to it holds', () => {
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // The bar and the line read different keys, so their data is processed as separate requests.
    type SharedAxisRow = { bx: string; by: number; lx: string; ly: number };

    const sharedAxisRows = (line: number): SharedAxisRow[] =>
        Array.from({ length: 4 }, (_, i) => ({ bx: `C${i}`, by: 10 + i, lx: `C${i}`, ly: line }));

    function sharedAxisOptions(data: SharedAxisRow[], lineSeries: object = {}): AgCartesianChartOptions {
        return prepareTestOptions({
            data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                { type: 'bar', xKey: 'bx', yKey: 'by', fill: '#2e86de' },
                { type: 'line', xKey: 'lx', yKey: 'ly', ...lineSeries },
            ],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        } as AgCartesianChartOptions);
    }

    const heightsOf = (c: AgChartInstance) =>
        getBarSeriesKeptInternals(c).contextNodeData!.nodeData.map((d) => d.height);

    /**
     * Renders the chart as it should end up, then moves the same chart to `start` and applies `change`. The bars must
     * end where the fresh render put them.
     */
    async function expectFreshRender(
        target: AgCartesianChartOptions,
        start: AgCartesianChartOptions,
        change: () => Promise<void>
    ) {
        chart = AgCharts.create(target);
        await waitForChartStability(chart);
        const expected = { image: ctx.snapshot(), heights: heightsOf(chart) };

        await chart.update(start);
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        await change();
        await waitForChartStability(chart);

        expect(ctx.snapshot()).not.toMatchImage(started, { writeDiff: false });
        expect(ctx.snapshot()).toMatchImage(expected.image);
        expect(heightsOf(chart)).toEqual(expected.heights);
    }

    describe('another request moves a shared axis', () => {
        it('redraws the bars at the new scale when the same data array is resubmitted', async () => {
            const rows = sharedAxisRows(20);
            await expectFreshRender(sharedAxisOptions(sharedAxisRows(80)), sharedAxisOptions(rows), async () => {
                for (const row of rows) row.ly = 80;
                await chart!.updateDelta({ data: rows });
            });
        });

        it('redraws the bars at the new scale when a new array of the same rows is submitted', async () => {
            const rows = sharedAxisRows(20);
            await expectFreshRender(sharedAxisOptions(sharedAxisRows(80)), sharedAxisOptions(rows), async () => {
                for (const row of rows) row.ly = 80;
                await chart!.updateDelta({ data: rows.slice() });
            });
        });

        it('redraws the bars at the new scale when the line holds its own data and the chart data is resubmitted', async () => {
            const lineRows = sharedAxisRows(20);
            const barRows = sharedAxisRows(0);
            await expectFreshRender(
                sharedAxisOptions(barRows, { data: sharedAxisRows(80) }),
                sharedAxisOptions(barRows, { data: lineRows }),
                async () => {
                    for (const row of lineRows) row.ly = 80;
                    await chart!.updateDelta({ data: barRows.slice() });
                }
            );
        });

        it('redraws the bars at the new scale when the line gets new data in a series delta', async () => {
            await expectFreshRender(
                sharedAxisOptions(sharedAxisRows(0), { data: sharedAxisRows(80) }),
                sharedAxisOptions(sharedAxisRows(0), { data: sharedAxisRows(20) }),
                async () => {
                    await chart!.updateDelta({
                        data: sharedAxisRows(0),
                        series: [
                            { type: 'bar', xKey: 'bx', yKey: 'by', fill: '#2e86de' },
                            { type: 'line', xKey: 'lx', yKey: 'ly', data: sharedAxisRows(80) },
                        ],
                    } as any);
                }
            );
        });

        it('keeps the bars when the other series moves without moving the axis', async () => {
            const rows = sharedAxisRows(5);
            chart = AgCharts.create(sharedAxisOptions(sharedAxisRows(7)));
            await waitForChartStability(chart);
            const expected = ctx.snapshot();

            await chart.update(sharedAxisOptions(rows));
            await waitForChartStability(chart);
            await chart.updateDelta({ data: rows.slice() });
            await waitForChartStability(chart);
            const heights = heightsOf(chart);

            for (const row of rows) row.ly = 7;
            const spies = deproxy(chart).series.map((series) => vi.spyOn(series as any, 'createNodeData'));
            await chart.updateDelta({ data: rows.slice() });
            await waitForChartStability(chart);
            const builds = spies.map((spy) => spy.mock.calls.length);
            for (const spy of spies) spy.mockRestore();

            // The line moved, so it rebuilds; the bars saw the same data under the same scale.
            expect(builds).toEqual([0, 1]);
            expect(heightsOf(chart)).toEqual(heights);
            expect(ctx.snapshot()).toMatchImage(expected);
        });
    });

    describe('every datum array a kept series holds', () => {
        const FILTER_COUNT = 8;
        type FilterRow = { category: string; value: number; filter: number };

        const filterRows = (): FilterRow[] =>
            Array.from({ length: FILTER_COUNT }, (_, i) => ({ category: `C${i}`, value: 10 + i, filter: 4 + (i % 3) }));

        const filterOptions = (data: FilterRow[]) =>
            prepareTestOptions({
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'value', yFilterKey: 'filter', fill: '#2e86de' } as any,
                ],
                axes: { x: { type: 'category' }, y: { type: 'number' } },
            } as AgCartesianChartOptions);

        async function hoverBar(c: AgChartInstance, index: number) {
            const { seriesRect } = deproxy(c);
            const bar = getBarSeriesKeptInternals(c).contextNodeData!.nodeData[index];
            await hoverAction(seriesRect!.x + bar.x + bar.width / 2, seriesRect!.y + bar.y + bar.height / 2)(c);
            await waitForChartStability(c);
        }

        /** The copies of the hovered bar that are drawn: the bar itself, and the unfiltered one behind it. */
        const highlightCopies = (c: AgChartInstance) => {
            const { highlightNodeGroup, phantomHighlightGroup } = getBarSeriesKeptInternals(c);
            return {
                main: [...highlightNodeGroup.children()].length,
                phantom: [...phantomHighlightGroup.children()].length,
            };
        };

        it('points at the rows of equal replacement data, the phantom datums included', async () => {
            chart = AgCharts.create(filterOptions(filterRows()));
            await waitForChartStability(chart);
            await hoverBar(chart, 3);

            const next = filterRows();
            const work = await measureRedrawWork(chart, () => chart!.updateDelta({ data: next }));

            const { phantomNodeData } = getBarSeriesKeptInternals(chart).contextNodeData!;
            expect(work.nodeDataBuilds).toBe(0);
            expect(phantomNodeData).toHaveLength(FILTER_COUNT);
            expect(phantomNodeData.every((d, i) => d.datum === next[i])).toBe(true);
            const active = deproxy(chart).ctx.highlightManager.getActiveHighlight() as { datum: unknown } | undefined;
            expect(active?.datum).toBe(next[3]);
        });

        it('draws the hovered bar as it was drawn before the equal replacement', async () => {
            chart = AgCharts.create(filterOptions(filterRows()));
            await waitForChartStability(chart);
            await hoverBar(chart, 3);
            const expected = ctx.snapshot();
            const expectedCopies = highlightCopies(chart);
            expect(expectedCopies).toEqual({ main: 1, phantom: 1 });

            await hoverBar(chart, 5);
            await chart.updateDelta({ data: filterRows() });
            await waitForChartStability(chart);
            await hoverBar(chart, 3);

            expect(highlightCopies(chart)).toEqual(expectedCopies);
            expect(ctx.snapshot()).toMatchImage(expected);
        });
    });
});
