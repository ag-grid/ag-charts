import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChartUpdateType } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import { createChart, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

const OPTIONS: AgCartesianChartOptions = {
    data: [
        { month: 'Jan', value: 162 },
        { month: 'Mar', value: 302 },
        { month: 'May', value: 800 },
    ],
    series: [{ type: 'line', xKey: 'month', yKey: 'value' }],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

describe('Axis font loading', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('re-measures tick layouts when fonts load', async () => {
        chart = await createChart(OPTIONS);
        const axis = chart.axes.find((a) => a.position === 'bottom')!;
        const calculateTickLayout = vi.spyOn(axis as any, 'calculateTickLayout');

        // A layout with no domain/range change must hit the cache, or the second assertion is vacuous.
        chart.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(chart);
        expect(calculateTickLayout).not.toHaveBeenCalled();

        chart.ctx.eventsHub.emit('font:load', null);
        await waitForChartStability(chart);
        expect(calculateTickLayout).toHaveBeenCalled();
    });

    it('keeps animating when a font load moves the layout', async () => {
        chart = await createChart(OPTIONS);
        const skipCurrentBatch = vi.spyOn(chart.ctx.animationManager, 'skipCurrentBatch');

        const perturbAnimationRect = () => {
            (chart as any).animationRect = new BBox(0, 0, 1, 1);
        };

        perturbAnimationRect();
        chart.update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(chart);
        expect(skipCurrentBatch).toHaveBeenCalled();

        skipCurrentBatch.mockClear();
        perturbAnimationRect();
        chart.ctx.eventsHub.emit('font:load', null);
        await waitForChartStability(chart);
        expect(skipCurrentBatch).not.toHaveBeenCalled();
    });
});
