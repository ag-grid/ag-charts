import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { Chart } from '../../chart';
import { getSeriesNodeData } from '../../test/seriesAccessors';
import {
    createChart,
    deproxy,
    expectFade,
    playTransitionAnimations,
    prepareTestOptions,
    renderedPixelAt,
    setupMockCanvas,
    setupMockConsole,
    shownOpacity,
    spyOnAnimationFrames,
} from '../../test/utils';

// 0.3 of the default animation duration of 1s.
const FADE_MS = 300;
const WHITE = [255, 255, 255, 255];

describe('LineSeries marker highlight fade', () => {
    setupMockConsole();
    setupMockCanvas();
    playTransitionAnimations();
    const frames = spyOnAnimationFrames();

    let chart: Chart;
    /** The colour each series' markers render with at full opacity. */
    let opaque: number[][];

    afterEach(() => {
        chart?.destroy();
    });

    // Without a line stroke, the pixel at a marker's centre is the marker's fill alone.
    const options = prepareTestOptions<AgCartesianChartOptions>({
        background: { fill: '#ffffff' },
        data: [
            { category: 'Q1', apples: 5, oranges: 2 },
            { category: 'Q2', apples: 7, oranges: 3 },
            { category: 'Q3', apples: 6, oranges: 4 },
        ],
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left', gridLine: { enabled: false } },
        },
        legend: { enabled: false },
        series: (['apples', 'oranges'] as const).map((yKey) => ({
            type: 'line' as const,
            xKey: 'category',
            yKey,
            strokeWidth: 0,
            marker: { size: 20 },
        })),
    });

    const datum = (seriesIndex: number, datumIndex: number) =>
        getSeriesNodeData<HighlightNodeDatum>(chart, seriesIndex)[datumIndex];
    const pixel = (seriesIndex: number, datumIndex: number) => {
        const { point } = getSeriesNodeData<{ point: { x: number; y: number } }>(chart, seriesIndex)[datumIndex];
        return renderedPixelAt(chart, chart.seriesRect!.x + point.x, chart.seriesRect!.y + point.y);
    };
    /** The opacity a marker is seen at, whichever nodes draw it. */
    const shown = (seriesIndex: number, datumIndex: number) =>
        shownOpacity(pixel(seriesIndex, datumIndex), opaque[seriesIndex], WHITE);
    const highlight = (highlighted?: HighlightNodeDatum) =>
        chart.ctx.highlightManager.updateHighlight(chart.id, highlighted);

    const capture = <T>(sampler: () => T) =>
        frames.captureAnimationFrames(chart, sampler, { frames: 10, duration: FADE_MS + 100, rendered: true });

    const create = async (chartOptions: AgCartesianChartOptions) => {
        chart?.destroy();
        chart = deproxy(await createChart(chartOptions));
        await frames.runToEnd(chart);
        await chart.waitForUpdate();
        opaque = chart.series.map((_, seriesIndex) => pixel(seriesIndex, 0));
    };

    beforeEach(async () => {
        await create(options);
    });

    it('fades the markers of the other series when a marker is highlighted', async () => {
        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });

    it('fades the markers back when the highlight is removed', async () => {
        highlight(datum(0, 1));
        await frames.runToEnd(chart);
        const dimmed = shown(1, 0);

        highlight();
        const trajectory = await capture(() => shown(1, 0));

        expectFade(trajectory, dimmed, 1);
    });

    it('fades a marker from its highlighted copy when the highlight moves to another marker', async () => {
        // Line markers keep the other items of the highlighted series at full opacity unless asked.
        const unhighlightedItem = { fillOpacity: 0.4, strokeOpacity: 0.4 };
        await create({
            ...options,
            series: options.series?.map((series) => ({ ...series, highlight: { unhighlightedItem } })),
        });
        highlight(datum(0, 1));
        await frames.runToEnd(chart);

        highlight(datum(0, 2));
        const trajectory = await capture(() => shown(0, 1));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });
});
