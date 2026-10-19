import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    getSeriesAggregationInternals,
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

    it('redraws when the data does not move but the chart resizes', async () => {
        const { chart: c } = await createBarChart(200);

        const work = await measureRedrawWork(c, () => c.updateDelta({ data: makeData(200), width: 500 }));

        expect(work.nodeDataBuilds).toBe(1);
    });
});
