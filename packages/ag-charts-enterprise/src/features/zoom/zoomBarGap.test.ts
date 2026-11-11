import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    deproxy,
    getSeriesContextNodeData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

// The nodes of a bar series carry the drawn clip and, when the gap is on, the segment's span before the inset.
interface GapNode {
    clipBBox?: { y: number; height: number };
    pickStart: number;
    pickLength: number;
}

describe('bar gap when zooming', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const keys = ['a', 'b', 'c'];

    function options(data: object[], xKey: string, xAxis: object, gap: number): AgCartesianChartOptions {
        return {
            animation: { enabled: false },
            legend: { enabled: false },
            zoom: { enabled: true, anchorPointX: 'pointer', anchorPointY: 'pointer' },
            data,
            series: keys.map((yKey) => ({ type: 'bar', xKey, yKey, stacked: true, gap }) as AgBarSeriesOptions),
            axes: { x: xAxis, y: { type: 'number' } },
        } as AgCartesianChartOptions;
    }

    /** How far, in pixels, each segment is pulled in from the segment it had before the gap, at each edge. */
    function insets(seriesIndex: number) {
        return (getSeriesContextNodeData(chart!, seriesIndex).nodeData as unknown as GapNode[])
            .filter((d) => d.clipBBox != null && d.pickLength > 0 && d.clipBBox.height > 0)
            .map((d) => [
                Math.round((d.clipBBox!.y - d.pickStart) * 1000) / 1000,
                Math.round((d.pickStart + d.pickLength - d.clipBBox!.y - d.clipBBox!.height) * 1000) / 1000,
            ]);
    }

    function height(seriesIndex: number) {
        const nodes = getSeriesContextNodeData(chart!, seriesIndex).nodeData as unknown as GapNode[];
        return nodes.find((d) => d.pickLength > 0)!.pickLength;
    }

    async function zoomIn(times: number) {
        for (let i = 0; i < times; i++) await scrollAction(400, 300, -1)(chart!);
        await waitForChartStability(chart!);
    }

    it('keeps a middle segment pulled in by half the gap at both edges while the segments grow', async () => {
        const data = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((k, i) => ({ k, a: 10 + i, b: 20 + i, c: 30 - i }));
        chart = await createEnterpriseChart(options(data, 'k', { type: 'category' }, 4));

        const before = { height: height(1), insets: insets(1) };
        expect(before.insets.length).toBeGreaterThan(0);
        for (const edges of before.insets) expect(edges).toEqual([2, 2]);

        await zoomIn(3);

        // The zoom changed the scale (the segments are a different size), but not the gap.
        expect(height(1)).not.toBeCloseTo(before.height, 0);
        const after = insets(1);
        expect(after.length).toBeGreaterThan(0);
        for (const edges of after) expect(edges).toEqual([2, 2]);
    });

    it('insets aggregated buckets by 0 or half the gap only, at every zoom level', async () => {
        const t0 = Date.UTC(2024, 0, 1);
        const data = Array.from({ length: 5000 }, (_, i) => ({
            t: new Date(t0 + i * 60000),
            a: 10 + (i % 7),
            b: 20 + (i % 5),
            c: 30 + (i % 3),
        }));
        chart = await createEnterpriseChart(options(data, 't', { type: 'unit-time' }, 4));
        expect((deproxy(chart).series[0] as any).nodeDatumContext?.dataAggregationFilter).toBeDefined();

        for (let level = 0; level < 3; level++) {
            for (const series of [0, 1, 2]) {
                const all = insets(series).flat();
                expect(all.length).toBeGreaterThan(0);
                for (const inset of all) expect([0, 2]).toContain(inset);
            }
            await zoomIn(2);
        }
    });
});
