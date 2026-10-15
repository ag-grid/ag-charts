import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { ukData } from './series/map-test/ukData';
import ukTopology from './series/map-test/ukTopology.json';
import { prepareEnterpriseTestOptions } from './test/utils';

const FLOWS = [
    { from: 'A', to: 'C', size: 4 },
    { from: 'A', to: 'D', size: 2 },
    { from: 'B', to: 'C', size: 3 },
    { from: 'B', to: 'D', size: 5 },
];

const numericNodeData = (chart: any) =>
    chart.series.map((s: any) =>
        (s.contextNodeData?.nodeData ?? []).map((d: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(d).filter(([, value]) => typeof value === 'number'))
        )
    );

const MULTI_LINE_TITLE = { title: { text: 'A\nmulti-line\ntitle' } };
const PADDING = { padding: { top: 120, left: 100 } };

describe('updateDelta() layout keys', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;
    let fresh: any;

    afterEach(() => {
        chart?.destroy();
        fresh?.destroy();
        chart = fresh = undefined;
    });

    // Applies `delta` to a chart built from `options`, then compares `read` of it with a chart built with `delta` already
    // in its options.
    async function expectDeltaToMatchFreshChart(options: object, delta: object, read: (chart: any) => unknown) {
        const create = (extra: object) =>
            deproxy(AgCharts.create(prepareEnterpriseTestOptions({ ...options, ...extra } as any)));
        const proxy = AgCharts.create(prepareEnterpriseTestOptions(options as any));
        chart = deproxy(proxy);
        await waitForChartStability(chart);

        await proxy.updateDelta(delta as any);
        await waitForChartStability(chart);

        fresh = create(delta);
        await waitForChartStability(fresh);
        expect(read(chart)).toEqual(read(fresh));
        return read(chart);
    }

    describe('on charts without axes', () => {
        it.each([
            { type: 'sankey', delta: PADDING },
            { type: 'sankey', delta: MULTI_LINE_TITLE },
            { type: 'chord', delta: PADDING },
        ])('lays out $type series as a fresh chart does after $delta', async ({ type, delta }) => {
            const nodeData = await expectDeltaToMatchFreshChart(
                { data: FLOWS, series: [{ type, fromKey: 'from', toKey: 'to', sizeKey: 'size' }] },
                delta,
                numericNodeData
            );
            expect((nodeData as unknown[][])[0].length).toBeGreaterThan(0);
        });

        it.each([PADDING, MULTI_LINE_TITLE])(
            'projects map-shape series as a fresh chart does after %o',
            async (delta) => {
                const geometry = await expectDeltaToMatchFreshChart(
                    { data: ukData, topology: ukTopology, series: [{ type: 'map-shape', idKey: 'name' }] },
                    delta,
                    (c) => JSON.stringify(c.series[0].contextNodeData.nodeData.map((d: any) => d.projectedGeometry))
                );
                expect((geometry as string).length).toBeGreaterThan(100);
            }
        );
    });

    describe('on charts with axes', () => {
        const cells = ['a', 'b', 'c'].flatMap((x) => ['p', 'q'].map((y, i) => ({ x, y, value: x.length + i })));

        it.each([
            { type: 'heatmap', data: cells, series: { xKey: 'x', yKey: 'y', colorKey: 'value' } },
            { type: 'bar', data: cells, series: { xKey: 'x', yKey: 'value' } },
        ])('lays out a $type series as a fresh chart does after a multi-line title', async ({ type, data, series }) => {
            const geometry = await expectDeltaToMatchFreshChart(
                { data, series: [{ type, ...series }] },
                MULTI_LINE_TITLE,
                (c) => c.series[0].contextNodeData.nodeData.map((d: any) => [d.x, d.y, d.width, d.height])
            );
            expect((geometry as unknown[]).length).toBeGreaterThan(0);
        });
    });
});
