import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    deproxy,
    expectFade,
    getDatumCanvasBounds,
    getSeriesNodeData,
    playTransitionAnimations,
    renderedPixelAt,
    setupMockCanvas,
    setupMockConsole,
    shownOpacity,
    spyOnAnimationFrames,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

const UNHIGHLIGHTED_SERIES = 0.2;
const WHITE = [255, 255, 255, 255];

describe('Transition animations', () => {
    setupMockConsole();
    setupMockCanvas();
    playTransitionAnimations();
    const frames = spyOnAnimationFrames();

    let proxy: AgChartInstance;
    afterEach(() => {
        proxy?.destroy();
    });

    const options: AgCartesianChartOptions = {
        background: { fill: '#ffffff' },
        data: [
            { category: 'Q1', apples: 5, oranges: 3 },
            { category: 'Q2', apples: 7, oranges: 4 },
            { category: 'Q3', apples: 6, oranges: 5 },
        ],
        // Grid lines would cross the pixels the tests read.
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left', gridLine: { enabled: false } },
        },
        legend: { enabled: false },
        series: [
            { type: 'bar', xKey: 'category', yKey: 'apples' },
            { type: 'bar', xKey: 'category', yKey: 'oranges' },
        ],
    };

    const centre = (seriesIndex: number, datumIndex: number): [number, number] => {
        const { x, y, width, height } = getDatumCanvasBounds(proxy, seriesIndex, datumIndex);
        return [x + width / 2, y + height / 2];
    };
    const pixel = (seriesIndex: number, datumIndex: number) =>
        renderedPixelAt(proxy, ...centre(seriesIndex, datumIndex));

    const create = async (chartOptions: AgCartesianChartOptions) => {
        proxy = await createEnterpriseChart(chartOptions);
        await frames.runToEnd(proxy);
        await deproxy(proxy).waitForUpdate();
    };

    /** Highlights an item of the first series and samples the opacity the second series is seen at. */
    const highlightAndCapture = async (durationMs: number) => {
        const opaque = pixel(1, 0);
        const shown = () => shownOpacity(pixel(1, 0), opaque, WHITE);
        const chart = deproxy(proxy);
        chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData(proxy, 0)[1]);
        const trajectory = await frames.captureAnimationFrames(proxy, shown, {
            frames: 10,
            duration: durationMs,
            rendered: true,
        });
        return { trajectory, shown };
    };

    it('fades a highlight when animation is disabled', async () => {
        await create({ ...options, animation: { enabled: false } });

        const { trajectory } = await highlightAndCapture(400);

        expectFade(trajectory, 1, UNHIGHLIGHTED_SERIES);
    });

    it('scales the fade with the animation duration', async () => {
        await create({ ...options, animation: { duration: 2000 } });

        // 0.3 of 2s: still fading after 400ms, done by 700ms.
        const { trajectory, shown } = await highlightAndCapture(400);
        expect(trajectory.at(-1)).toBeGreaterThan(UNHIGHLIGHTED_SERIES);

        await frames.captureAnimationFrames(proxy, () => undefined, { frames: 3, duration: 300 });
        await deproxy(proxy).waitForUpdate();
        expect(shown()).toBe(UNHIGHLIGHTED_SERIES);
    });
});
