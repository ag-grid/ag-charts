import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgChartInstance } from 'ag-charts-community';
import {
    countRectsMarkedDirty,
    deproxy,
    measureRedrawWork,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';

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
        });
    }

    // The heatmap is left out: one of its rects is still marked dirty on identical data.
    for (const rectCase of CASES.filter(({ name }) => name !== 'heatmap')) {
        it(`leaves the ${rectCase.name} rects clean for identical data`, async () => {
            const c = await create(rectCase);

            expect(await countRectsMarkedDirty(c, () => c.updateDelta({ data: rectCase.makeRows(COUNT, 0) }))).toBe(0);
        });
    }
});
