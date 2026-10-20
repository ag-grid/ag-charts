import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgCartesianSeriesOptions, type AgChartInstance } from 'ag-charts-community';
import {
    deproxy,
    expectNonBlank,
    measureRedrawWork,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../test/utils';

type Row = Record<string, number | string>;

interface RectCase {
    name: string;
    createOptions: (rows: Row[]) => AgCartesianChartOptions;
    makeRows: (count: number, shift: number) => Row[];
    /** Mutates a charted field of one row in place. */
    mutate(row: Row): void;
}

const rangeRows = (count: number, shift: number): Row[] =>
    Array.from({ length: count }, (_, i) => {
        const high = 10 + ((i + shift) % 17);
        return { category: `C${i}`, low: high / 2, high };
    });

const valueRows = (count: number, shift: number): Row[] =>
    Array.from({ length: count }, (_, i) => ({ category: `C${i}`, value: 10 + ((i + shift) % 17) - (i % 3) * 12 }));

const heatmapRows = (count: number, shift: number): Row[] =>
    Array.from({ length: count }, (_, i) => ({
        x: `X${Math.floor(i / 10)}`,
        y: `Y${i % 10}`,
        level: 1 + ((i + shift) % 9),
    }));

const CASES: RectCase[] = [
    {
        name: 'range-bar',
        createOptions: (data) => ({
            data,
            title: { text: 'Range bars' },
            series: [{ type: 'range-bar', xKey: 'category', yLowKey: 'low', yHighKey: 'high' }],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        }),
        makeRows: rangeRows,
        mutate: (row) => (row.high = (row.high as number) + 5),
    },
    {
        name: 'waterfall',
        createOptions: (data) => ({
            data,
            title: { text: 'Waterfall' },
            series: [{ type: 'waterfall', xKey: 'category', yKey: 'value' }],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        }),
        makeRows: valueRows,
        mutate: (row) => (row.value = (row.value as number) + 5),
    },
    {
        name: 'heatmap',
        createOptions: (data) => ({
            data,
            title: { text: 'Heatmap' },
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'level' }],
        }),
        makeRows: heatmapRows,
        mutate: (row) => (row.level = (row.level as number) + 3),
    },
];

describe('rect series redraw where nothing moves', () => {
    const ctx = setupMockCanvas();
    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const COUNT = 120;
    const builds = (c: AgChartInstance) => deproxy(c).series[0].nodeDataVersion;

    async function create({ createOptions, makeRows }: RectCase) {
        chart = await createEnterpriseChart({
            animation: { enabled: false },
            legend: { enabled: false },
            ...createOptions(makeRows(COUNT, 0)),
        });
        // The first redraw can write back geometry the first frame drew snapped, so settle before measuring.
        await chart.updateDelta({ data: makeRows(COUNT, 0) });
        await waitForChartStability(chart);
        return chart;
    }

    for (const rectCase of CASES) {
        describe(rectCase.name, () => {
            it('rebuilds nothing for the same data in a new array', async () => {
                const c = await create(rectCase);
                const before = ctx.snapshot();

                const work = await measureRedrawWork(c, () => c.updateDelta({ data: rectCase.makeRows(COUNT, 0) }));

                expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
                expect(ctx.snapshot()).toMatchImage(before);
            });

            it('hands the node data the rows of the latest data when nothing moved', async () => {
                const c = await create(rectCase);
                const next = rectCase.makeRows(COUNT, 0);

                const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

                const nodeData = (deproxy(c).series[0] as any).contextNodeData.nodeData as {
                    datum?: unknown;
                    datumIndex: number;
                }[];
                expect(work.nodeDataBuilds).toBe(0);
                expect(nodeData.length).toBeGreaterThan(0);
                expect(nodeData.every((d) => d.datum === next[d.datumIndex])).toBe(true);
            });

            it('rebuilds nothing for a title change', async () => {
                const c = await create(rectCase);

                const work = await measureRedrawWork(c, () => c.updateDelta({ title: { text: 'Another title' } }));

                expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
            });

            it('redraws when the data moves', async () => {
                const c = await create(rectCase);
                const before = ctx.snapshot();
                const version = builds(c);

                const work = await measureRedrawWork(c, () => c.updateDelta({ data: rectCase.makeRows(COUNT, 1) }));

                expect(work.nodeDataBuilds).toBe(1);
                expect(builds(c)).toBeGreaterThan(version);
                (expect(ctx.snapshot()) as any).not.toMatchImage(before, { writeDiff: false });
            });

            it('redraws when the data array is mutated in place', async () => {
                const rows = rectCase.makeRows(COUNT, 0);
                chart = await createEnterpriseChart({ animation: { enabled: false }, ...rectCase.createOptions(rows) });
                const c = chart;

                rectCase.mutate(rows[3]);
                const work = await measureRedrawWork(c, () => c.updateDelta({ data: rows }));

                expect(work.nodeDataBuilds).toBe(1);
            });

            it('redraws when the number of rows changes', async () => {
                const c = await create(rectCase);

                const work = await measureRedrawWork(c, () =>
                    c.updateDelta({ data: rectCase.makeRows(COUNT - 10, 0) })
                );

                expect(work.nodeDataBuilds).toBe(1);
            });
        });
    }
});

interface StyleCase {
    name: string;
    rows: (shift: number) => Row[];
    options: (series: object, data: Row[]) => AgCartesianChartOptions;
    base: object;
    /** Changes that only restyle: the bars stay exactly where they are. */
    restyles: [string, object][];
}

// Few enough items for the fills to show between any strokes.
const STYLE_COUNT = 30;
const NO_STROKE = { strokeWidth: 0 };

const STYLE_CASES: StyleCase[] = [
    {
        name: 'range-bar',
        rows: (shift) => rangeRows(STYLE_COUNT, shift),
        base: { type: 'range-bar', xKey: 'category', yLowKey: 'low', yHighKey: 'high', fill: '#2e86de', ...NO_STROKE },
        options: (series, data) => ({
            data,
            series: [series as AgCartesianSeriesOptions],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        }),
        restyles: [
            ['fill', { fill: '#e67e22' }],
            ['fillOpacity', { fillOpacity: 0.4 }],
        ],
    },
    {
        name: 'waterfall',
        rows: (shift) => valueRows(STYLE_COUNT, shift),
        base: {
            type: 'waterfall',
            xKey: 'category',
            yKey: 'value',
            item: { positive: { fill: '#2e86de', ...NO_STROKE }, negative: { fill: '#c0392b', ...NO_STROKE } },
        },
        options: (series, data) => ({
            data,
            series: [series as AgCartesianSeriesOptions],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        }),
        restyles: [
            [
                'positive fill',
                { item: { positive: { fill: '#27ae60', ...NO_STROKE }, negative: { fill: '#c0392b', ...NO_STROKE } } },
            ],
            [
                'negative fillOpacity',
                {
                    item: {
                        positive: { fill: '#2e86de', ...NO_STROKE },
                        negative: { fill: '#c0392b', fillOpacity: 0.3, ...NO_STROKE },
                    },
                },
            ],
        ],
    },
];

describe('rect series keep node data only while every input to it holds', () => {
    const ctx = setupMockCanvas();
    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // The bars and the line read different keys, so their data is processed as separate requests. Waterfall and
    // heatmap charts take no other series, so range-bar is the only enterprise rect series to share an axis.
    const rows = (line: number): Row[] =>
        Array.from({ length: 4 }, (_, i) => ({ bx: `C${i}`, low: 5, high: 10 + i, lx: `C${i}`, ly: line }));

    const options = (data: Row[]) =>
        prepareEnterpriseTestOptions({
            data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                { type: 'range-bar', xKey: 'bx', yLowKey: 'low', yHighKey: 'high' },
                { type: 'line', xKey: 'lx', yKey: 'ly' },
            ],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        } as AgCartesianChartOptions);

    it('redraws the range bars at the new scale when another series moves the shared axis', async () => {
        chart = await createEnterpriseChart(options(rows(80)));
        const expected = ctx.snapshot();
        expectNonBlank(expected);

        const moving = rows(20);
        await chart.update(options(moving));
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        for (const row of moving) row.ly = 80;
        await chart.updateDelta({ data: moving.slice() });
        await waitForChartStability(chart);

        (expect(ctx.snapshot()) as any).not.toMatchImage(started, { writeDiff: false });
        expect(ctx.snapshot()).toMatchImage(expected);
    });
});

describe('rect series restyle where nothing moves', () => {
    const ctx = setupMockCanvas();
    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    for (const styleCase of STYLE_CASES) {
        describe(styleCase.name, () => {
            const make = (series: object, shift = 0) =>
                prepareEnterpriseTestOptions({
                    animation: { enabled: false },
                    legend: { enabled: false },
                    ...styleCase.options(series, styleCase.rows(shift)),
                } as AgCartesianChartOptions);

            // Renders the changed series fresh, moves the same chart back to the base series, then applies the change as
            // a delta: it has to end where the fresh render was.
            for (const [name, change] of styleCase.restyles) {
                it(`paints a colour-only change to ${name} as a fresh render would`, async () => {
                    chart = await createEnterpriseChart(make({ ...styleCase.base, ...change }));
                    const expected = ctx.snapshot();

                    await chart.update(make(styleCase.base));
                    await waitForChartStability(chart);
                    const started = ctx.snapshot();
                    const c = chart;

                    await c.updateDelta({ series: [{ ...styleCase.base, ...change }] } as any);
                    await waitForChartStability(c);

                    (expect(ctx.snapshot()) as any).not.toMatchImage(started, { writeDiff: false });
                    expect(ctx.snapshot()).toMatchImage(expected);
                });
            }

            // An enterprise chart's series delta also carries the navigator's mirrored mini-chart series.
            for (const [name, change] of styleCase.restyles) {
                it(`restyles without rebuilding for a colour-only change to ${name}`, async () => {
                    chart = await createEnterpriseChart(make(styleCase.base));
                    await chart.updateDelta({ data: styleCase.rows(0) }); // settle the first (crisp) frame
                    await waitForChartStability(chart);
                    const c = chart;

                    const work = await measureRedrawWork(c, () =>
                        c.updateDelta({ series: [{ ...styleCase.base, ...change }] } as any)
                    );

                    expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
                });
            }

            it('paints a colour-only change as a fresh render would with a visible navigator', async () => {
                const [, change] = styleCase.restyles[0];
                const withNavigator = (series: object) =>
                    prepareEnterpriseTestOptions({
                        ...make(series),
                        navigator: { enabled: true },
                    } as AgCartesianChartOptions);

                chart = await createEnterpriseChart(withNavigator({ ...styleCase.base, ...change }));
                const expected = ctx.snapshot();

                await chart.update(withNavigator(styleCase.base));
                await waitForChartStability(chart);
                const started = ctx.snapshot();
                const c = chart;

                await c.updateDelta({ series: [{ ...styleCase.base, ...change }] } as any);
                await waitForChartStability(c);

                (expect(ctx.snapshot()) as any).not.toMatchImage(started, { writeDiff: false });
                expect(ctx.snapshot()).toMatchImage(expected, { writeDiff: false });
            });

            describe('with a visible navigator', () => {
                const withNavigator = (series: object, miniChart: object = {}) =>
                    prepareEnterpriseTestOptions({
                        ...make(series),
                        navigator: { enabled: true, miniChart: { enabled: true, ...miniChart } },
                    } as AgCartesianChartOptions);

                const settled = async (options: AgCartesianChartOptions) => {
                    chart = await createEnterpriseChart(options);
                    await chart.updateDelta({ data: styleCase.rows(0) }); // settle the first (crisp) frame
                    await waitForChartStability(chart);
                    return chart;
                };

                it('restyles without rebuilding for a colour-only change', async () => {
                    const c = await settled(withNavigator(styleCase.base));
                    const [, change] = styleCase.restyles[0];

                    const work = await measureRedrawWork(c, () =>
                        c.updateDelta({ series: [{ ...styleCase.base, ...change }] } as any)
                    );

                    expect(work).toEqual({ nodeDataBuilds: 0, rectPathBuilds: 0 });
                });

                it('rebuilds when another navigator option moves with the restyle', async () => {
                    const c = await settled(withNavigator(styleCase.base));
                    const [, change] = styleCase.restyles[0];

                    const work = await measureRedrawWork(c, () =>
                        c.updateDelta({
                            series: [{ ...styleCase.base, ...change }],
                            navigator: { height: 50 },
                        } as any)
                    );

                    expect(work.nodeDataBuilds).toBe(1);
                });

                it('rebuilds when the mini chart series move by more than a restyle', async () => {
                    const c = await settled(withNavigator(styleCase.base));
                    const [, change] = styleCase.restyles[0];
                    const moved =
                        styleCase.name === 'waterfall'
                            ? { item: { positive: { cornerRadius: 4 } } }
                            : { cornerRadius: 4 };

                    const work = await measureRedrawWork(c, () =>
                        c.updateDelta({
                            series: [{ ...styleCase.base, ...change }],
                            navigator: { miniChart: { series: [{ ...styleCase.base, ...change, ...moved }] } },
                        } as any)
                    );

                    expect(work.nodeDataBuilds).toBe(1);
                });
            });

            it.each([
                ['a corner radius', { cornerRadius: 4 }],
                ['a label', { label: { enabled: true } }],
            ])('rebuilds for a change to %s, which is not paint alone', async (_name, change) => {
                chart = await createEnterpriseChart(make(styleCase.base));
                await chart.updateDelta({ data: styleCase.rows(0) });
                await waitForChartStability(chart);
                const c = chart;
                const key = styleCase.name === 'waterfall' ? { item: { positive: change, negative: change } } : change;

                const work = await measureRedrawWork(c, () =>
                    c.updateDelta({ series: [{ ...styleCase.base, ...key }] } as any)
                );

                expect(work.nodeDataBuilds).toBe(1);
            });

            it('moves the bars to the same pixels as a fresh render', async () => {
                chart = await createEnterpriseChart(make(styleCase.base, 4));
                const expected = ctx.snapshot();

                await chart.update(make(styleCase.base));
                await waitForChartStability(chart);
                const started = ctx.snapshot();
                const c = chart;

                const work = await measureRedrawWork(c, () => c.updateDelta({ data: styleCase.rows(4) }));

                expect(work.nodeDataBuilds).toBe(1);
                (expect(ctx.snapshot()) as any).not.toMatchImage(started, { writeDiff: false });
                expect(ctx.snapshot()).toMatchImage(expected);
            });

            it('moves the bars after redraws that did not move them', async () => {
                chart = await createEnterpriseChart(make(styleCase.base, 4));
                const expected = ctx.snapshot();
                await chart.update(make(styleCase.base));
                await waitForChartStability(chart);
                const c = chart;

                for (let i = 0; i < 3; i++) {
                    const work = await measureRedrawWork(c, () => c.updateDelta({ data: styleCase.rows(0) }));
                    expect(work.nodeDataBuilds).toBe(0);
                }
                await c.updateDelta({ data: styleCase.rows(4) });
                await waitForChartStability(c);

                expect(ctx.snapshot()).toMatchImage(expected);
            });
        });
    }

    describe('heatmap', () => {
        const make = (series: object, shift = 0) =>
            prepareEnterpriseTestOptions({
                animation: { enabled: false },
                legend: { enabled: false },
                data: heatmapRows(STYLE_COUNT * 3, shift),
                series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'level', ...series }],
            } as AgCartesianChartOptions);

        const scale = (...colors: string[]) => ({ colorScale: { fills: colors.map((color) => ({ color })) } });
        const base = scale('#2e86de', '#c0392b');

        it.each([
            ['colorScale', scale('#27ae60', '#f1c40f')],
            ['stroke', { stroke: '#222222', strokeWidth: 2 }],
        ])('paints a change to %s as a fresh render would', async (_name, change) => {
            chart = await createEnterpriseChart(make({ ...base, ...change }));
            const expected = ctx.snapshot();

            await chart.update(make(base));
            await waitForChartStability(chart);
            const started = ctx.snapshot();
            const c = chart;

            await c.updateDelta({
                series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'level', ...base, ...change }],
            } as any);
            await waitForChartStability(c);

            (expect(ctx.snapshot()) as any).not.toMatchImage(started, { writeDiff: false });
            expect(ctx.snapshot()).toMatchImage(expected);
        });

        it.each([
            ['colorScale', scale('#27ae60', '#f1c40f')],
            ['stroke', { stroke: '#222222', strokeWidth: 2 }],
        ])('restyles without rebuilding for a change to %s', async (_name, change) => {
            chart = await createEnterpriseChart(make(base));
            await chart.updateDelta({ data: heatmapRows(STYLE_COUNT * 3, 0) });
            await waitForChartStability(chart);
            const c = chart;

            const work = await measureRedrawWork(c, () =>
                c.updateDelta({
                    series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'level', ...base, ...change }],
                } as any)
            );

            expect(work.nodeDataBuilds).toBe(0);
        });

        it('rebuilds for a style change while labels are shown, as a label holds its cell style', async () => {
            const labelled = { ...base, label: { enabled: true } };
            chart = await createEnterpriseChart(make(labelled));
            await chart.updateDelta({ data: heatmapRows(STYLE_COUNT * 3, 0) });
            await waitForChartStability(chart);
            const c = chart;

            const work = await measureRedrawWork(c, () =>
                c.updateDelta({
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'x',
                            yKey: 'y',
                            colorKey: 'level',
                            ...labelled,
                            ...scale('#27ae60', '#f1c40f'),
                        },
                    ],
                } as any)
            );

            expect(work.nodeDataBuilds).toBe(1);
        });

        it('hands the labels the rows of the latest data when nothing moved', async () => {
            const rows = () => heatmapRows(STYLE_COUNT * 3, 0);
            chart = await createEnterpriseChart(make({ ...base, label: { enabled: true } }));
            await chart.updateDelta({ data: rows() });
            await waitForChartStability(chart);
            const c = chart;
            const next = rows();

            const work = await measureRedrawWork(c, () => c.updateDelta({ data: next }));

            const labelData = (deproxy(c).series[0] as any).contextNodeData.labelData as {
                datum: unknown;
                datumIndex: number;
            }[];
            expect(work.nodeDataBuilds).toBe(0);
            expect(labelData.length).toBeGreaterThan(0);
            expect(labelData.every((d) => d.datum === next[d.datumIndex])).toBe(true);
        });

        it('paints the same data again, over and over, as a fresh render would', async () => {
            chart = await createEnterpriseChart(make(base, 2));
            const expected = ctx.snapshot();

            await chart.update(make(base));
            await waitForChartStability(chart);
            const c = chart;
            for (let i = 0; i < 3; i++) {
                await c.updateDelta({ data: heatmapRows(STYLE_COUNT * 3, 0) });
                await waitForChartStability(c);
            }
            await c.updateDelta({ data: heatmapRows(STYLE_COUNT * 3, 2) });
            await waitForChartStability(c);

            expect(ctx.snapshot()).toMatchImage(expected);
        });
    });
});

describe('waterfall labels fed by a chart formatter', () => {
    const ctx = setupMockCanvas();
    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const COUNT = 20;
    const label = { label: { enabled: true } };
    const item = (positive: object = {}) => ({
        positive: { fill: '#2e86de', ...NO_STROKE, ...label, ...positive },
        negative: { fill: '#c0392b', ...NO_STROKE, ...label },
        total: { ...label },
    });
    const make = (read: () => string, positive?: object) =>
        prepareEnterpriseTestOptions({
            animation: { enabled: false },
            legend: { enabled: false },
            data: valueRows(COUNT, 0),
            formatter: ({ value }: { value: number }) => `${value}${read()}`,
            series: [{ type: 'waterfall', xKey: 'category', yKey: 'value', item: item(positive) }],
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        } as AgCartesianChartOptions);

    /** Renders fresh with the formatter at `b`, moves the same chart back to `a`, flips it and applies `delta`. */
    async function expectLabelsFollow(delta: object, positive?: object) {
        let suffix = 'b';
        const read = () => suffix;
        chart = await createEnterpriseChart(make(read, positive));
        const expected = ctx.snapshot();
        expectNonBlank(expected);

        suffix = 'a';
        await chart.update(make(read));
        await waitForChartStability(chart);
        const started = ctx.snapshot();

        suffix = 'b';
        const c = chart;
        const work = await measureRedrawWork(c, () => c.updateDelta(delta));
        const actual = ctx.snapshot();

        expect(work.nodeDataBuilds).toBe(1);
        (expect(actual) as any).not.toMatchImage(started, { writeDiff: false });
        expect(actual).toMatchImage(expected);
    }

    it('re-runs for the same data', async () => {
        await expectLabelsFollow({ data: valueRows(COUNT, 0) });
    });

    it('re-runs alongside an item colour change', async () => {
        const positive = { fill: '#27ae60' };
        await expectLabelsFollow(
            { series: [{ type: 'waterfall', xKey: 'category', yKey: 'value', item: item(positive) }] },
            positive
        );
    });
});
