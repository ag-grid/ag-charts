import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    deproxy,
    expectFade,
    getSeriesNodeData,
    playTransitionAnimations,
    renderedPixelAt,
    setupMockCanvas,
    setupMockConsole,
    shownOpacity,
    spyOnAnimationFrames,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';

// 0.3 of the default animation duration of 1s.
const FADE_MS = 300;
const WHITE = [255, 255, 255, 255];
const UNHIGHLIGHTED_ITEM = { fillOpacity: 0.4, strokeOpacity: 0.4 };

interface RectDatum {
    x: number;
    y: number;
    width: number;
    height: number;
}

const CASES: { name: string; options: AgChartOptions }[] = [
    {
        name: 'histogram',
        options: {
            data: [1, 2, 2, 3, 3, 3, 4, 4, 5].map((value) => ({ value })),
            series: [
                {
                    type: 'histogram',
                    xKey: 'value',
                    bins: [
                        [0, 2],
                        [2, 4],
                        [4, 6],
                    ],
                },
            ],
        } as AgCartesianChartOptions,
    },
    {
        name: 'waterfall',
        options: {
            data: [
                { stage: 'A', value: 5 },
                { stage: 'B', value: 4 },
                { stage: 'C', value: 6 },
            ],
            series: [{ type: 'waterfall', xKey: 'stage', yKey: 'value' }],
        },
    },
    {
        name: 'range-bar',
        options: {
            data: [
                { month: 'Jan', low: 2, high: 6 },
                { month: 'Feb', low: 3, high: 8 },
                { month: 'Mar', low: 1, high: 7 },
            ],
            series: [{ type: 'range-bar', xKey: 'month', yLowKey: 'low', yHighKey: 'high' }],
        },
    },
    {
        name: 'funnel',
        options: {
            data: [
                { stage: 'Visited', value: 10 },
                { stage: 'Added', value: 6 },
                { stage: 'Bought', value: 3 },
            ],
            series: [{ type: 'funnel', stageKey: 'stage', valueKey: 'value', label: { enabled: false } }],
        },
    },
];

describe.each(CASES)('$name series highlight fade', ({ options }) => {
    setupMockConsole();
    setupMockCanvas();
    playTransitionAnimations();
    const frames = spyOnAnimationFrames();

    let proxy: AgChartInstance;
    /** The colour each bar renders with at full opacity. */
    let opaque: number[][];

    afterEach(() => {
        proxy?.destroy();
    });

    const chart = () => deproxy(proxy);
    const datum = (datumIndex: number) => getSeriesNodeData(proxy, 0)[datumIndex];
    /** The colour rendered at the middle of a bar. */
    const pixel = (datumIndex: number) => {
        const { x, y, width, height } = getSeriesNodeData<RectDatum>(proxy, 0)[datumIndex];
        const seriesRect = chart().seriesRect!;
        return renderedPixelAt(proxy, seriesRect.x + x + width / 2, seriesRect.y + y + height / 2);
    };
    /** The opacity a bar is seen at, whichever nodes draw it. */
    const shown = (datumIndex: number) => shownOpacity(pixel(datumIndex), opaque[datumIndex], WHITE);
    const highlight = (highlighted?: ReturnType<typeof datum>) =>
        chart().ctx.highlightManager.updateHighlight(chart().id, highlighted);

    const capture = <T>(sampler: () => T) =>
        frames.captureAnimationFrames(proxy, sampler, { frames: 10, duration: FADE_MS + 100, rendered: true });

    const create = async () => {
        proxy = await createEnterpriseChart({
            ...options,
            background: { fill: '#ffffff' },
            legend: { enabled: false },
            series: options.series?.map((series) => ({
                ...series,
                highlight: { unhighlightedItem: UNHIGHLIGHTED_ITEM },
            })),
        } as AgChartOptions);
        await frames.runToEnd(proxy);
        await chart().waitForUpdate();
        opaque = [0, 1, 2].map(pixel);
    };

    it('fades the other bars when a bar is highlighted', async () => {
        await create();
        expect(opaque[0]).not.toEqual(WHITE);

        highlight(datum(1));
        const trajectory = await capture(() => shown(0));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });

    it('fades the bars back when the highlight is removed', async () => {
        await create();
        highlight(datum(1));
        await frames.runToEnd(proxy);
        const dimmed = shown(0);

        highlight();
        const trajectory = await capture(() => shown(0));

        expectFade(trajectory, dimmed, 1);
    });

    it('fades the bar losing the highlight when it moves to another bar', async () => {
        await create();
        highlight(datum(1));
        await frames.runToEnd(proxy);

        highlight(datum(2));
        const trajectory = await capture(() => shown(1));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });
});
