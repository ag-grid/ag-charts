import { describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { deproxy, scrollAction, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { getData } from '../../ag-charts-website/src/content/docs/benchmarks/_examples/high-perf-bar-stacked/data';
import { createEnterpriseChart } from './test/utils';

setupMockConsole();
setupMockCanvas();

function report(name: string, value: unknown) {
    process.stdout.write(`SPIKE ${name} ${JSON.stringify(value)}\n`);
}

describe('bar gap bench path spike', () => {
    it('which node path does each bench case take', async () => {
        const options = {
            data: getData(),
            animation: { enabled: false },
            zoom: { enabled: true, anchorPointX: 'pointer', anchorPointY: 'pointer', minVisibleItems: 0 },
            navigator: { enabled: true },
            series: [
                { type: 'bar', xKey: 'timestamp', yKey: 'open', stacked: true, gap: 4 },
                { type: 'bar', xKey: 'timestamp', yKey: 'close', stacked: true, gap: 4 },
            ],
            axes: { x: { type: 'unit-time' } },
        } as unknown as AgCartesianChartOptions;
        const pub = await createEnterpriseChart(options);
        const chart = deproxy(pub);
        const read = () => {
            const s = chart.series[0] as any;
            const c = s.nodeDatumContext;
            return {
                aggregated: c?.dataAggregationFilter != null,
                halfGap: c?.halfGap,
                crisp: c?.crisp,
                nodes: s.contextNodeData?.nodeData?.length,
                groupsUnique: s.processedData?.groupsUnique,
                n: s.processedData?.input?.count,
                groups: s.processedData?.groups?.length,
                insets: chart.series.map((se: any) => {
                    const hist: Record<string, number> = {};
                    for (const nd of se.contextNodeData?.nodeData ?? []) {
                        if (nd.clipBBox == null || nd.pickBBox == null) continue;
                        const low = Math.round(nd.clipBBox.y - nd.pickBBox.y);
                        const high = Math.round(nd.pickBBox.y + nd.pickBBox.height - (nd.clipBBox.y + nd.clipBBox.height));
                        const key = `low${low}/high${high}`;
                        hist[key] = (hist[key] ?? 0) + 1;
                    }
                    return hist;
                }),
            };
        };
        report('bench.initial', read());
        const steps: unknown[] = [];
        for (let i = 0; i < 10; i++) {
            await scrollAction(400, 300, -1)(chart);
            await pub.waitForUpdate();
            steps.push(read());
        }
        report('bench.zoomIn', steps);
        for (let i = 0; i < 10; i++) {
            await scrollAction(400, 300, 1)(chart);
            await pub.waitForUpdate();
        }
        report('bench.afterZoomOut', read());
        expect(true).toBe(true);
    }, 300000);
});
