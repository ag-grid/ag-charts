import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type { Chart } from './chart';
import {
    clickAction,
    deproxy,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

// AG-8173 — clicking a node's stroke must fire seriesNodeClick. Replicates the
// reporter's repro: a line marker of size 20 (pick radius 10) whose highlighted
// state draws a 10px stroke, so the drawn outer radius is 15.
describe('AG-8173 node stroke click detection', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const createOptions = (seriesNodeClick: () => void) =>
        ({
            data: [
                { year: '2015', spending: 35 },
                { year: '2016', spending: 40 },
                { year: '2017', spending: 43 },
                { year: '2018', spending: 44 },
            ],
            series: [
                {
                    type: 'line',
                    xKey: 'year',
                    yKey: 'spending',
                    marker: { size: 20 },
                    highlight: { highlightedItem: { fill: 'orange', stroke: 'blue', strokeWidth: 10 } },
                    listeners: { seriesNodeClick },
                },
            ],
        }) as AgCartesianChartOptions;

    it('fires seriesNodeClick when clicking within the highlighted stroke of a marker', async () => {
        const seriesNodeClick = vi.fn();
        chart = deproxy(AgCharts.create(prepareTestOptions(createOptions(seriesNodeClick))));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const [node] = (series as any).contextNodeData?.nodeData ?? [];
        expect(node).toBeDefined();

        const seriesRect = (chart as any).seriesRect;
        const cx = seriesRect.x + node.point.x;
        const cy = seriesRect.y + node.point.y;

        // Hover the marker centre so it highlights and draws the 10px blue stroke.
        await hoverAction(cx, cy)(chart);
        await waitForChartStability(chart);

        // Move into the stroke band: 12px from centre is outside the size/2 = 10 pick
        // radius but inside the drawn outer radius of 10 + 10/2 = 15.
        await hoverAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);
        await clickAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);

        expect(seriesNodeClick).toHaveBeenCalledTimes(1);
    });

    // Control: proves the harness reaches the real click path in jsdom, so the failure
    // above is the missing stroke hit region and not a broken fixture.
    it('control — fires seriesNodeClick when clicking the marker centre', async () => {
        const seriesNodeClick = vi.fn();
        chart = deproxy(AgCharts.create(prepareTestOptions(createOptions(seriesNodeClick))));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const [node] = (series as any).contextNodeData?.nodeData ?? [];
        const seriesRect = (chart as any).seriesRect;
        const cx = seriesRect.x + node.point.x;
        const cy = seriesRect.y + node.point.y;

        await hoverAction(cx, cy)(chart);
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);
        await waitForChartStability(chart);

        expect(seriesNodeClick).toHaveBeenCalledTimes(1);
    });

    // AC 2 — a node that draws no stroke keeps exactly today's hit region.
    it('does not widen the hit region when no stroke is drawn', async () => {
        const seriesNodeClick = vi.fn();
        const options = createOptions(seriesNodeClick);
        // strokeWidth without a stroke colour draws nothing, so nothing may be inflated.
        (options.series as any)[0].highlight = { highlightedItem: { fill: 'orange', strokeWidth: 10 } };
        (options.series as any)[0].marker = { size: 20, stroke: 'none', strokeWidth: 0 };
        chart = deproxy(AgCharts.create(prepareTestOptions(options)));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const [node] = (series as any).contextNodeData?.nodeData ?? [];
        const seriesRect = (chart as any).seriesRect;
        const cx = seriesRect.x + node.point.x;
        const cy = seriesRect.y + node.point.y;

        await hoverAction(cx, cy)(chart);
        await waitForChartStability(chart);
        await hoverAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);
        await clickAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);

        expect(seriesNodeClick).not.toHaveBeenCalled();
    });

    // The review finding on #7926: an `itemStyler` can widen a single datum's stroke, and that
    // width is not visible in `contextNodeData.styles`. No highlight override here, so the styler
    // is the only thing that can inflate the region.
    it('fires seriesNodeClick when clicking a stroke widened only by marker.itemStyler', async () => {
        const seriesNodeClick = vi.fn();
        const options = createOptions(seriesNodeClick);
        (options.series as any)[0].highlight = undefined;
        (options.series as any)[0].marker = {
            size: 20,
            itemStyler: () => ({ stroke: 'blue', strokeWidth: 10 }),
        };
        chart = deproxy(AgCharts.create(prepareTestOptions(options)));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const [node] = (series as any).contextNodeData?.nodeData ?? [];
        const seriesRect = (chart as any).seriesRect;
        const cx = seriesRect.x + node.point.x;
        const cy = seriesRect.y + node.point.y;

        // 12px is outside the size/2 = 10 pick radius but inside the styler's drawn outer radius of 15.
        await hoverAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);
        await clickAction(cx + 12, cy)(chart);
        await waitForChartStability(chart);

        expect(seriesNodeClick).toHaveBeenCalledTimes(1);
    });
});
