import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Rect } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import { STYLE_TRANSITION } from '../../../motion/animation';
import type { Chart } from '../../chart';
import { AnimationManager } from '../../interaction/animationManager';
import { InteractionState } from '../../interaction/interactionManager';
import { getSeriesNodeData, getSeriesSelectionNodes } from '../../test/seriesAccessors';
import {
    createChart,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
} from '../../test/utils';

// Theme defaults for several bar series: other items of the hovered series and other series.
const UNHIGHLIGHTED_ITEM = 0.6;
const UNHIGHLIGHTED_SERIES = 0.2;
// At the default animation duration of 1s.
const HIGHLIGHT_FADE_DURATION_MS = STYLE_TRANSITION * 1000;

describe('BarSeries highlight fade', () => {
    setupMockConsole();
    setupMockCanvas();
    const frames = spyOnAnimationFrames();

    let chart: Chart;

    beforeEach(() => {
        vi.spyOn(AnimationManager.prototype, 'isTransitionSkipped').mockReturnValue(false);
    });

    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    const options = prepareTestOptions<AgCartesianChartOptions>({
        data: [
            { category: 'Q1', apples: 5, oranges: 3 },
            { category: 'Q2', apples: 7, oranges: 4 },
            { category: 'Q3', apples: 6, oranges: 5 },
        ],
        legend: { enabled: false },
        series: [
            { type: 'bar', xKey: 'category', yKey: 'apples' },
            { type: 'bar', xKey: 'category', yKey: 'oranges' },
        ],
    });

    const inPlace = (seriesIndex: number) =>
        getSeriesSelectionNodes<Rect>(chart, 'datumSelection', seriesIndex).map((node) => node.fillOpacity);
    /** The overlay copies of highlighted bars, by datum index, including those fading out. */
    const overlay = (seriesIndex: number) =>
        Object.fromEntries(
            getSeriesSelectionNodes<Rect<HighlightNodeDatum>>(chart, 'highlightSelection', seriesIndex)
                .filter((node) => node.visible)
                .map((node) => [node.datum?.datumIndex, node.fillOpacity])
        );
    const datum = (seriesIndex: number, datumIndex: number) =>
        getSeriesNodeData<HighlightNodeDatum>(chart, seriesIndex)[datumIndex];
    const highlight = (highlighted?: HighlightNodeDatum) =>
        chart.ctx.highlightManager.updateHighlight(chart.id, highlighted);

    // Frames spanning the transition; the first frame only starts the clock, so the last lands beyond its end.
    const capture = <T>(sampler: () => T) =>
        frames.captureAnimationFrames(chart, sampler, { frames: 10, duration: HIGHLIGHT_FADE_DURATION_MS + 100 });

    const expectFade = (trajectory: number[], from: number, to: number) => {
        expect(trajectory[0]).toBe(from);
        expect(trajectory.at(-1)).toBe(to);
        for (let i = 1; i < trajectory.length; i++) {
            const step = trajectory[i] - trajectory[i - 1];
            expect(Math.sign(step) === Math.sign(to - from) || step === 0).toBe(true);
        }
        expect(trajectory.some((value) => value !== from && value !== to)).toBe(true);
    };

    beforeEach(async () => {
        chart = deproxy(await createChart(options));
        await frames.runToEnd(chart);
    });

    it('fades the other items and the other series when an item is highlighted', async () => {
        highlight(datum(0, 1));
        const trajectory = await capture(() => ({ hovered: inPlace(0), other: inPlace(1) }));

        expectFade(
            trajectory.map((sample) => sample.hovered[0]),
            1,
            UNHIGHLIGHTED_ITEM
        );
        expectFade(
            trajectory.map((sample) => sample.other[0]),
            1,
            UNHIGHLIGHTED_SERIES
        );
    });

    it('fades back when the highlight is removed', async () => {
        highlight(datum(0, 1));
        await frames.runToEnd(chart);

        highlight();
        const trajectory = await capture(() => inPlace(1)[0]);

        expectFade(trajectory, UNHIGHLIGHTED_SERIES, 1);
    });

    it('starts a superseding fade from the displayed opacity', async () => {
        highlight(datum(0, 1));
        const firstHalf = await frames.captureAnimationFrames(chart, () => inPlace(1)[0], {
            frames: 3,
            duration: HIGHLIGHT_FADE_DURATION_MS / 2,
        });
        const displayed = firstHalf.at(-1)!;
        expect(displayed).toBeGreaterThan(UNHIGHLIGHTED_SERIES);
        expect(displayed).toBeLessThan(1);

        highlight();
        const trajectory = await capture(() => inPlace(1)[0]);

        expectFade(trajectory, displayed, 1);
    });

    it('hands the highlight between items of a series without a jump', async () => {
        highlight(datum(0, 0));
        await frames.runToEnd(chart);
        expect(overlay(0)).toEqual({ 0: 1 });

        highlight(datum(0, 1));
        const trajectory = await capture(() => ({ inPlace: inPlace(0), overlay: overlay(0) }));

        // The overlay copies cross-fade over their in-place copies, which already display the unhighlighted item
        // opacity; the copy fading out is removed once it has.
        const leaving = trajectory.map((sample) => sample.overlay[0]).filter((opacity) => opacity != null);
        expectFade(leaving, 1, leaving.at(-1)!);
        expect(leaving.at(-1)).toBeLessThan(0.1);
        expectFade(
            trajectory.map((sample) => sample.overlay[1]),
            0,
            1
        );
        for (const sample of trajectory) {
            expect(sample.inPlace).toEqual([UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM]);
        }
        expect(overlay(0)).toEqual({ 1: 1 });
    });

    it('scales with the animation duration', async () => {
        chart.ctx.animationManager.defaultDuration = 2000;

        highlight(datum(0, 1));
        const trajectory = await capture(() => inPlace(1)[0]);

        expect(trajectory.at(-1)).toBeGreaterThan(UNHIGHLIGHTED_SERIES);
        await frames.runToEnd(chart);
        expect(inPlace(1)[0]).toBe(UNHIGHLIGHTED_SERIES);
    });

    it('snaps to the highlighted state when the current batch is skipped', async () => {
        highlight(datum(0, 1));
        await frames.captureAnimationFrames(chart, () => undefined, { frames: 2, duration: 60 });
        expect(inPlace(1)[0]).toBeGreaterThan(UNHIGHLIGHTED_SERIES);

        chart.ctx.animationManager.skipCurrentBatch();

        // Two bar series default to `highlight.mode: 'shared'`, which lights the other series' bar at the same category.
        expect(inPlace(1)).toEqual([UNHIGHLIGHTED_SERIES, 1, UNHIGHLIGHTED_SERIES]);
        expect(inPlace(0)).toEqual([UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM]);
    });

    describe('styles other than opacity', () => {
        const styledOptions = (otherFill: Pick<AgBarSeriesOptions, 'fill'>) =>
            prepareTestOptions<AgCartesianChartOptions>({
                ...options,
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        ...otherFill,
                        highlight: { unhighlightedSeries: { fill: '#000000', strokeWidth: 4 } },
                    },
                ],
            });
        const otherBar = () => getSeriesSelectionNodes<Rect>(chart, 'datumSelection', 1)[0];

        it('interpolates colours and stroke widths', async () => {
            chart.destroy();
            chart = deproxy(await createChart(styledOptions({ fill: '#ffffff' })));
            await frames.runToEnd(chart);

            highlight(datum(0, 1));
            const trajectory = await capture(() => ({ fill: otherBar().fill, strokeWidth: otherBar().strokeWidth }));

            expect(trajectory[0]).toEqual({ fill: '#ffffff', strokeWidth: 0 });
            expect(trajectory.at(-1)).toEqual({ fill: '#000000', strokeWidth: 4 });
            const middle = trajectory[Math.floor(trajectory.length / 2)];
            expect(middle.fill).not.toMatch(/^#(000000|ffffff)$/);
            expect(middle.strokeWidth).toBeGreaterThan(0);
            expect(middle.strokeWidth).toBeLessThan(4);
        });

        it('applies properties that cannot interpolate at the start', async () => {
            const gradient = { type: 'gradient' as const, colorStops: [{ color: 'red' }, { color: 'blue' }] };
            chart.destroy();
            chart = deproxy(await createChart(styledOptions({ fill: gradient })));
            await frames.runToEnd(chart);

            highlight(datum(0, 1));
            const trajectory = await capture(() => ({ fill: otherBar().fill, strokeWidth: otherBar().strokeWidth }));

            for (const sample of trajectory) {
                expect(sample.fill).toBe('#000000');
            }
            expectFade(
                trajectory.map((sample) => sample.strokeWidth),
                0,
                4
            );
        });
    });

    it('fades a highlight that arrives during a series animation once that animation has played', async () => {
        const proxy = await createChart(options);
        chart.destroy();
        chart = deproxy(proxy);
        await frames.runToEnd(chart);

        await proxy.updateDelta({
            data: [
                { category: 'Q1', apples: 2, oranges: 3 },
                { category: 'Q2', apples: 7, oranges: 4 },
                { category: 'Q3', apples: 6, oranges: 5 },
            ],
        });
        await frames.captureAnimationFrames(chart, () => undefined, { frames: 2, duration: 60 });
        expect(chart.ctx.animationManager.isActive()).toBe(true);

        highlight(datum(0, 1));
        const trajectory = await frames.captureAnimationFrames(
            chart,
            () => ({ animating: chart.ctx.animationManager.isActive(), opacity: inPlace(1)[0] }),
            { frames: 40, duration: 2000 }
        );

        const during = trajectory.filter((sample) => sample.animating);
        expect(during.length).toBeGreaterThan(0);
        expect(during.every((sample) => sample.opacity === 1)).toBe(true);
        // The fade starts in the frame that ends the series animation.
        expectFade(
            trajectory.slice(during.length - 1).map((sample) => sample.opacity),
            1,
            UNHIGHLIGHTED_SERIES
        );
    });

    it('keeps interaction unblocked while fading', async () => {
        highlight(datum(0, 1));
        await frames.captureAnimationFrames(chart, () => undefined, { frames: 2, duration: 60 });

        expect(chart.ctx.animationManager.isActive()).toBe(false);
        expect(chart.ctx.interactionManager.isState(InteractionState.Hoverable)).toBe(true);
    });

    it('reports the fade as an animation without clearing the highlight', async () => {
        const onStart = vi.fn();
        chart.ctx.animationManager.addListener('animation-start', onStart);
        const highlighted = datum(0, 1);

        highlight(highlighted);
        await frames.captureAnimationFrames(chart, () => undefined, { frames: 2, duration: 60 });

        expect(onStart).toHaveBeenCalledTimes(1);
        expect(chart.ctx.highlightManager.getActiveHighlight()).toBe(highlighted);
    });
});
