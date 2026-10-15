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

describe('updateDelta() layout keys on charts without axes', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;
    let fresh: any;

    afterEach(() => {
        chart?.destroy();
        fresh?.destroy();
        chart = fresh = undefined;
    });

    it.each([
        { type: 'sankey', delta: { padding: { top: 120, left: 100 } } },
        { type: 'sankey', delta: { title: { text: 'A\nmulti-line\ntitle' } } },
        { type: 'chord', delta: { padding: { top: 120, left: 100 } } },
    ])('lays out $type series as a fresh chart does after $delta', async ({ type, delta }) => {
        const options = (extra: object) =>
            prepareEnterpriseTestOptions({
                data: FLOWS,
                series: [{ type, fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
                ...extra,
            } as any);
        const proxy = AgCharts.create(options({}));
        chart = deproxy(proxy);
        await waitForChartStability(chart);

        await proxy.updateDelta(delta as any);
        await waitForChartStability(chart);

        fresh = deproxy(AgCharts.create(options(delta)));
        await waitForChartStability(fresh);
        expect(numericNodeData(chart)[0].length).toBeGreaterThan(0);
        expect(numericNodeData(chart)).toEqual(numericNodeData(fresh));
    });
});

describe('updateDelta() layout keys on a map', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;
    let fresh: any;

    afterEach(() => {
        chart?.destroy();
        fresh?.destroy();
        chart = fresh = undefined;
    });

    it.each([{ padding: { top: 120, left: 100 } }, { title: { text: 'A\nmulti-line\ntitle' } }])(
        'projects map-shape series as a fresh chart does after %o',
        async (delta) => {
            const options = (extra: object) =>
                prepareEnterpriseTestOptions({
                    data: ukData,
                    topology: ukTopology,
                    series: [{ type: 'map-shape', idKey: 'name' }],
                    ...extra,
                } as any);
            const proxy = AgCharts.create(options({}));
            chart = deproxy(proxy);
            await waitForChartStability(chart);

            await proxy.updateDelta(delta as any);
            await waitForChartStability(chart);

            fresh = deproxy(AgCharts.create(options(delta)));
            await waitForChartStability(fresh);
            const geometry = (c: any) =>
                JSON.stringify(c.series[0].contextNodeData.nodeData.map((d: any) => d.projectedGeometry));
            expect(geometry(chart).length).toBeGreaterThan(100);
            expect(geometry(chart)).toEqual(geometry(fresh));
        }
    );
});
