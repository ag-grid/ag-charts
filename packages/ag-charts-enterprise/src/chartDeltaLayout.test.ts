import { afterEach, describe, expect, it } from 'vitest';

import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { ukData } from './series/map-test/ukData';
import ukTopology from './series/map-test/ukTopology.json';
import { createEnterpriseChart } from './test/utils';

const FLOWS = [
    { from: 'A', to: 'C', size: 4 },
    { from: 'A', to: 'D', size: 2 },
    { from: 'B', to: 'C', size: 3 },
    { from: 'B', to: 'D', size: 5 },
];

const SECTORS = ['a', 'b', 'c', 'd'].map((label, i) => ({ label, value: i + 2 }));

const numericNodeData = (chart: any) =>
    chart.series.map((s: any) =>
        (s.contextNodeData?.nodeData ?? s.nodeData ?? []).map((d: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(d).filter(([, value]) => typeof value === 'number'))
        )
    );

// The polar series' radius is derived from the series rect, so it is read alongside the node data.
const polarGeometry = (chart: any) => ({
    radius: chart.series.map((s: any) => s.radius),
    centre: chart.series.map((s: any) => [s.centerX, s.centerY]),
    nodeData: numericNodeData(chart),
});

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
        const proxy = await createEnterpriseChart(options as any);
        chart = deproxy(proxy);

        await proxy.updateDelta(delta);
        await waitForChartStability(chart);

        fresh = deproxy(await createEnterpriseChart({ ...options, ...delta } as any));
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

        it.each([
            { type: 'pie', delta: PADDING },
            { type: 'pie', delta: MULTI_LINE_TITLE },
            { type: 'donut', delta: PADDING },
            { type: 'donut', delta: MULTI_LINE_TITLE },
        ])('sizes a $type series as a fresh chart does after $delta', async ({ type, delta }) => {
            const { nodeData } = (await expectDeltaToMatchFreshChart(
                { data: SECTORS, series: [{ type, angleKey: 'value' }] },
                delta,
                polarGeometry
            )) as ReturnType<typeof polarGeometry>;
            expect((nodeData[0][0] as { outerRadius: number }).outerRadius).toBeGreaterThan(0);
            expect(nodeData[0].length).toBeGreaterThan(0);
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

        it.each([
            { type: 'radar-line', series: { angleKey: 'label', radiusKey: 'value' } },
            { type: 'radar-area', series: { angleKey: 'label', radiusKey: 'value' } },
            { type: 'nightingale', series: { angleKey: 'label', radiusKey: 'value' } },
            { type: 'radial-bar', series: { angleKey: 'value', radiusKey: 'label' } },
            { type: 'radial-column', series: { angleKey: 'label', radiusKey: 'value' } },
        ])('sizes a $type series as a fresh chart does after a title or padding delta', async ({ type, series }) => {
            for (const delta of [MULTI_LINE_TITLE, PADDING]) {
                const { radius, nodeData } = (await expectDeltaToMatchFreshChart(
                    { data: SECTORS, series: [{ type, ...series }] },
                    delta,
                    polarGeometry
                )) as ReturnType<typeof polarGeometry>;
                expect(radius[0]).toBeGreaterThan(0);
                expect(nodeData[0].length).toBeGreaterThan(0);
                chart.destroy();
                fresh.destroy();
            }
        });
    });
});
