import { beforeEach, describe, expect, it } from 'vitest';

import { type Node, Rect } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-types';

import { InteractionState } from '../../interaction/interactionManager';
import { getBarSeriesContextNodeData, withUndocumentedOptions } from '../../test/communitySeriesAccessors';
import {
    TWO_BAR_SERIES_OPTIONS,
    UNHIGHLIGHTED_SERIES,
    WHITE,
    describeHighlightFade,
    fadeDuration,
    rectCentre,
    setupHighlightFade,
} from '../../test/highlightFadeSuite';
import { getDatumCanvasBounds } from '../../test/seriesAccessors';
import { shapesOf } from '../../test/shadowFixtures';
import {
    createChart,
    expectFade,
    hoverLegendItem,
    pressKey,
    renderedPixelAt,
    shownOpacity,
    tabIntoChart,
} from '../../test/utils';

// Theme default opacity of the other items of the hovered series.
const UNHIGHLIGHTED_ITEM = 0.6;
const BLACK = [0, 0, 0, 255];

describeHighlightFade([{ name: 'bar series', options: TWO_BAR_SERIES_OPTIONS, itemCentre: rectCentre }], createChart);

describe('BarSeries highlight fade', () => {
    const { frames, proxy, chart, datum, pixel, shown, highlight, capture, create } = setupHighlightFade(createChart);
    const options = TWO_BAR_SERIES_OPTIONS;
    const shownRow = (seriesIndex: number) => [0, 1, 2].map((datumIndex) => shown(seriesIndex, datumIndex));

    beforeEach(async () => {
        await create(options);
    });

    it('fades a highlight without the animation module, while a data update snaps', async () => {
        await proxy().updateDelta({
            data: [
                { category: 'Q1', apples: 2, oranges: 3 },
                { category: 'Q2', apples: 7, oranges: 4 },
                { category: 'Q3', apples: 6, oranges: 5 },
            ],
        });
        await chart().waitForUpdate();
        const { height } = getDatumCanvasBounds(chart(), 0, 0);
        await frames.runToEnd(chart());
        expect(getDatumCanvasBounds(chart(), 0, 0).height).toBe(height);

        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0));

        expectFade(trajectory, 1, UNHIGHLIGHTED_SERIES);
    });

    it('snaps a highlight unless highlight changes are set to fade', async () => {
        await create(options, { gradual: false });

        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0));

        expect(trajectory.every((opacity) => opacity === UNHIGHLIGHTED_SERIES)).toBe(true);
    });

    /** The bars in the scene, in place and highlighted, whichever of them are still fading. */
    const barCount = () =>
        chart().series.reduce(
            (count, series) =>
                count + shapesOf(series.contentGroup, Rect).length + shapesOf(series.highlightNodeGroup, Rect).length,
            0
        );

    it.each(['cutout', 'overlay'] as const)(
        'leaves no extra bars in the scene once the fades have ended (%s)',
        async (drawingMode) => {
            await create({ ...options, highlight: { drawingMode } });
            const before = barCount();

            highlight(datum(0, 0));
            await frames.runToEnd(chart());
            highlight(datum(0, 1));
            await frames.runToEnd(chart());
            highlight(datum(1, 2));
            await frames.runToEnd(chart());
            highlight();
            await frames.runToEnd(chart());

            expect(barCount()).toBe(before);
        }
    );

    it('fades out the highlighted copy of a phantom bar when the highlight clears', async () => {
        await create({
            ...options,
            data: [
                { category: 'Q1', apples: 5, filtered: 2 },
                { category: 'Q2', apples: 7, filtered: 3 },
                { category: 'Q3', apples: 6, filtered: 2 },
            ],
            series: [
                withUndocumentedOptions({ type: 'bar', xKey: 'category', yKey: 'apples' } as const, {
                    yFilterKey: 'filtered',
                }),
            ],
        });
        /** The colour rendered in the part of a phantom bar above its filtered bar. */
        const phantomPixel = () => {
            const phantom = getBarSeriesContextNodeData(chart()).phantomNodeData[1];
            const { x, y } = chart().seriesRect!;
            return renderedPixelAt(chart(), x + phantom.x + phantom.width / 2, y + phantom.y + 2);
        };
        const before = phantomPixel();
        highlight(datum(0, 1));
        await frames.runToEnd(chart());
        const highlighted = phantomPixel();
        expect(highlighted).not.toEqual(before);

        highlight();
        const trajectory = await capture(() => shownOpacity(phantomPixel(), highlighted, before));

        // The two colours are close, so rounding can step slightly the wrong way; check it passes between them.
        expect(trajectory[0]).toBe(1);
        expect(trajectory.at(-1)).toBe(0);
        expect(trajectory.filter((value) => value > 0.2 && value < 0.8).length).toBeGreaterThanOrEqual(2);
    });

    it('leaves no extra bars in the scene when the layout changes while a highlight fades out', async () => {
        await create({ ...options, highlight: { drawingMode: 'overlay' } });
        const before = barCount();
        highlight(datum(0, 1));
        await frames.runToEnd(chart());

        highlight();
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });
        await proxy().updateDelta({ width: 700 });
        await chart().waitForUpdate();

        expect(barCount()).toBe(before);
    });

    it('leaves no extra bars in the scene when a highlight clears in the same update as a data change', async () => {
        await create({ ...options, highlight: { drawingMode: 'overlay' } });
        const before = barCount();
        highlight(datum(0, 1));
        await frames.runToEnd(chart());

        highlight();
        await proxy().updateDelta({
            data: [
                { category: 'Q1', apples: 2, oranges: 3 },
                { category: 'Q2', apples: 7, oranges: 4 },
                { category: 'Q3', apples: 6, oranges: 5 },
            ],
        });
        await frames.runToEnd(chart());

        expect(barCount()).toBe(before);
    });

    it('starts a superseding fade from the displayed opacity', async () => {
        highlight(datum(0, 1));
        const firstHalf = await frames.captureAnimationFrames(chart(), () => shown(1, 0), {
            frames: 3,
            duration: fadeDuration(chart()) / 2,
            rendered: true,
        });
        const displayed = firstHalf.at(-1)!;
        expect(displayed).toBeGreaterThan(UNHIGHLIGHTED_SERIES);
        expect(displayed).toBeLessThan(1);

        highlight();
        const trajectory = await capture(() => shown(1, 0));

        expectFade(trajectory, displayed, 1);
    });

    it.each(['cutout', 'overlay'] as const)(
        'hands the highlight between items of a series without a jump (%s)',
        async (drawingMode) => {
            await create({ ...options, highlight: { drawingMode } });

            highlight(datum(0, 0));
            await frames.runToEnd(chart());
            expect(shownRow(0)).toEqual([1, UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM]);

            highlight(datum(0, 1));
            const trajectory = await capture(() => shownRow(0));

            expectFade(
                trajectory.map((sample) => sample[0]),
                1,
                UNHIGHLIGHTED_ITEM
            );
            expectFade(
                trajectory.map((sample) => sample[1]),
                UNHIGHLIGHTED_ITEM,
                1
            );
            for (const sample of trajectory) {
                expect(sample[2]).toBe(UNHIGHLIGHTED_ITEM);
            }
        }
    );

    it('keeps a bar shown when the highlight moves to another bar of its group', async () => {
        highlight(datum(0, 0));
        await frames.runToEnd(chart());

        const before = shown(0, 0);
        highlight(datum(1, 0));
        const visible = await capture(() => shown(0, 0));

        const floor = Math.min(before, visible.at(-1)!);
        for (const opacity of visible) {
            expect(opacity).toBeGreaterThanOrEqual(floor);
        }
    });

    const withItemStyler = (
        itemStyler: NonNullable<AgBarSeriesOptions['itemStyler']>,
        data = options.data
    ): AgCartesianChartOptions => ({
        ...options,
        data,
        series: options.series?.map((series) => ({ ...series, itemStyler }) as AgBarSeriesOptions),
    });
    // More distinct styles than a series shares.
    const distinctFills = Array.from({ length: 40 }, (_, index) => ({
        category: `C${index}`,
        apples: 5,
        oranges: 3,
        fill: `rgb(${index * 4}, 80, 160)`,
    }));

    it.each([
        ['', options, 0],
        [' with an item styler', withItemStyler(() => ({})), 0],
        // Past the styles that share, so the sampled bar's style compares by value.
        [' with distinct item styles', withItemStyler((params) => ({ fill: params.datum.fill }), distinctFills), 36],
    ])(
        'ends the fade of an unhighlighted item on time while the highlight keeps moving%s',
        async (_, chartOptions, first) => {
            await create(chartOptions);
            highlight(datum(0, first));
            await frames.runToEnd(chart());

            const step = 20;
            const trajectory = await frames.captureAnimationFrames(chart(), () => shown(0, first), {
                frames: 25,
                duration: 25 * step,
                rendered: true,
                onFrame: async (i) => {
                    if (i !== 0 && i !== 5) return;
                    highlight(datum(0, first + (i === 0 ? 1 : 2)));
                    await chart().waitForUpdate();
                },
            });

            // The second move restyles every item, but the first item's fade keeps its course rather than restarting.
            const settled = Math.ceil(fadeDuration(chart()) / step) + 2;
            expect(trajectory[settled]).toBe(UNHIGHLIGHTED_ITEM);
            expect(trajectory[settled - 4]).toBeGreaterThan(UNHIGHLIGHTED_ITEM);
        }
    );

    // The chart-wide limit is 1000 shapes, counted before the highlight adds its copies.
    it.each([
        [500, 1],
        [501, 0],
    ])('with %i bars in each of two series, starts %i fading animations', async (bars, animations) => {
        const data = Array.from({ length: bars }, (_, index) => ({ category: `C${index}`, apples: 5, oranges: 3 }));
        await create({ ...options, data });
        let started = 0;
        chart().ctx.animationManager.addListener('animation-start', () => started++);

        highlight(datum(0, 1));
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });

        expect(started).toBe(animations);
    });

    it.each<[string, Partial<AgCartesianChartOptions>]>([
        ['layout', { width: 700 }],
        [
            'data',
            {
                data: [
                    { category: 'Q1', apples: 4, oranges: 3 },
                    { category: 'Q2', apples: 7, oranges: 4 },
                    { category: 'Q3', apples: 6, oranges: 5 },
                ],
            },
        ],
    ])('snaps to the highlighted state when the %s changes during the fade', async (_, delta) => {
        highlight(datum(0, 1));
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });
        await chart().waitForUpdate();
        expect(shown(1, 0)).toBeGreaterThan(UNHIGHLIGHTED_SERIES);

        await proxy().updateDelta(delta);
        await chart().waitForUpdate();

        // The highlighted category is left out: after a resize its highlight keeps its old bounds until highlighted again.
        expect([shown(1, 0), shown(1, 2)]).toEqual([UNHIGHLIGHTED_SERIES, UNHIGHLIGHTED_SERIES]);
        expect([shown(0, 0), shown(0, 2)]).toEqual([UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM]);
    });

    it('fades the other series when a legend item is hovered', async () => {
        await create({ ...options, legend: { enabled: true } });

        await hoverLegendItem(chart(), 1);
        const trajectory = await capture(() => ({ hovered: shown(1, 0), other: shown(0, 0) }));

        expect(trajectory.every((sample) => sample.hovered === 1)).toBe(true);
        expectFade(
            trajectory.map((sample) => sample.other),
            1,
            UNHIGHLIGHTED_SERIES
        );
    });

    it('leaves the chart as it was once a highlight has moved, cleared and faded', async () => {
        const countNodes = (node: Node): number => {
            let count = 1;
            if ('children' in node && typeof node.children === 'function') {
                for (const child of node.children() as Iterable<Node>) count += countNodes(child);
            }
            return count;
        };
        const image = () => {
            const { canvas } = chart().ctx.scene;
            return [...canvas.context.getImageData(0, 0, canvas.element.width, canvas.element.height).data];
        };
        const nodesBefore = countNodes(chart().seriesRoot);
        const imageBefore = image();

        for (const highlighted of [datum(0, 0), datum(0, 1), datum(1, 2), undefined]) {
            highlight(highlighted);
            await frames.captureAnimationFrames(chart(), () => undefined, {
                frames: 3,
                duration: fadeDuration(chart()) / 2,
            });
        }
        await frames.runToEnd(chart());
        await chart().waitForUpdate();

        expect(countNodes(chart().seriesRoot)).toBe(nodesBefore);
        expect(image()).toEqual(imageBefore);
    });

    describe('styles other than opacity', () => {
        const styledOptions = (otherFill: Pick<AgBarSeriesOptions, 'fill'>): AgCartesianChartOptions => ({
            ...options,
            series: [
                { type: 'bar', xKey: 'category', yKey: 'apples' },
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'oranges',
                    ...otherFill,
                    stroke: '#ff0000',
                    strokeWidth: 0,
                    highlight: { unhighlightedSeries: { fill: '#000000', strokeWidth: 4, opacity: 1 } },
                },
            ],
        });
        /** How many device pixels of red stroke show along the middle of a bar, from just outside its left edge. */
        const shownStrokeWidth = () => {
            const { x, y, height } = getDatumCanvasBounds(chart(), 1, 0);
            let count = 0;
            for (let dx = -3; dx < 6; dx++) {
                const [r, g, b] = renderedPixelAt(chart(), x + dx, y + height / 2);
                if (r > 127 && g < 64 && b < 64) count++;
            }
            return count;
        };

        it('interpolates colours and stroke widths', async () => {
            await create(styledOptions({ fill: '#ffffff' }));

            highlight(datum(0, 1));
            const trajectory = await capture(() => ({ fill: pixel(1, 0), strokeWidth: shownStrokeWidth() }));

            expect(trajectory[0]).toEqual({ fill: WHITE, strokeWidth: 0 });
            expect(trajectory.at(-1)).toEqual({ fill: BLACK, strokeWidth: 4 });
            const middle = trajectory[Math.floor(trajectory.length / 2)];
            expect(middle.fill[0]).toBeGreaterThan(0);
            expect(middle.fill[0]).toBeLessThan(255);
            expect(middle.strokeWidth).toBeGreaterThan(0);
            expect(middle.strokeWidth).toBeLessThan(4);
        });

        it('applies properties that cannot interpolate at the start', async () => {
            const gradient = { type: 'gradient' as const, colorStops: [{ color: 'red' }, { color: 'blue' }] };
            await create(styledOptions({ fill: gradient }));

            highlight(datum(0, 1));
            const trajectory = await capture(() => ({ fill: pixel(1, 0), strokeWidth: shownStrokeWidth() }));

            for (const sample of trajectory) {
                expect(sample.fill).toEqual(BLACK);
            }
            expectFade(
                trajectory.map((sample) => sample.strokeWidth),
                0,
                4
            );
        });
    });

    it('fades a highlight that arrives during a series animation once that animation has played', async () => {
        await proxy().updateDelta({
            data: [
                { category: 'Q1', apples: 2, oranges: 3 },
                { category: 'Q2', apples: 7, oranges: 4 },
                { category: 'Q3', apples: 6, oranges: 5 },
            ],
        });
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });
        expect(chart().ctx.animationManager.isBlocking()).toBe(true);

        highlight(datum(0, 1));
        const trajectory = await frames.captureAnimationFrames(
            chart(),
            () => ({
                animating: chart().ctx.animationManager.isBlocking(),
                hoverable: chart().ctx.interactionManager.isState(InteractionState.Hoverable),
                opacity: shown(1, 0),
            }),
            { frames: 40, duration: 2000, rendered: true }
        );

        const during = trajectory.filter((sample) => sample.animating);
        expect(during.length).toBeGreaterThan(0);
        expect(during.every((sample) => sample.opacity === 1)).toBe(true);
        // The fade starts in the frame that ends the series animation, and interaction resumes with it.
        const fade = trajectory.slice(during.length - 1);
        expectFade(
            fade.map((sample) => sample.opacity),
            1,
            UNHIGHLIGHTED_SERIES
        );
        expect(fade.slice(1).every((sample) => sample.hoverable)).toBe(true);
    });

    it('keeps interaction unblocked while fading', async () => {
        highlight(datum(0, 1));
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });

        expect(chart().ctx.animationManager.isBlocking()).toBe(false);
        expect(chart().ctx.interactionManager.isState(InteractionState.Hoverable)).toBe(true);
    });

    it('reports the fade as an animation without clearing the highlight', async () => {
        let started = 0;
        chart().ctx.animationManager.addListener('animation-start', () => started++);
        const highlighted = datum(0, 1);

        highlight(highlighted);
        await frames.captureAnimationFrames(chart(), () => undefined, { frames: 2, duration: 60 });

        expect(started).toBe(1);
        expect(chart().ctx.highlightManager.getActiveHighlight()).toBe(highlighted);
    });

    it('renders the styles a keyboard focus change settles on', async () => {
        await tabIntoChart(chart());
        // jsdom cannot detect :focus-visible, so an arrow key is what switches to the keyboard device.
        await pressKey(chart(), 'ArrowRight');
        await pressKey(chart(), 'ArrowLeft');
        await frames.runToEnd(chart());
        await chart().waitForUpdate();

        expect(shownRow(0)).toEqual([1, UNHIGHLIGHTED_ITEM, UNHIGHLIGHTED_ITEM]);
        expect(shownRow(1)).toEqual([1, UNHIGHLIGHTED_SERIES, UNHIGHLIGHTED_SERIES]);
    });
});
