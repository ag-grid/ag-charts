import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import { STYLE_TRANSITION } from '../../motion/animation';
import { getDatumCanvasBounds, getPolarSeriesCenter, getSeriesNodeData } from './seriesAccessors';
import {
    type ChartOrProxy,
    deproxy,
    expectFade,
    playTransitionAnimations,
    renderedPixelAt,
    setupMockCanvas,
    setupMockConsole,
    shownOpacity,
    spyOnAnimationFrames,
} from './utils';

export const WHITE = [255, 255, 255, 255];
/** Theme default opacity of the series a highlight is not in, where there are several. */
export const UNHIGHLIGHTED_SERIES = 0.2;
const UNHIGHLIGHTED_ITEM = { fillOpacity: 0.4, strokeOpacity: 0.4 };

/** Two bar series, without grid lines, which would cross the pixels the tests read. */
export const TWO_BAR_SERIES_OPTIONS: AgCartesianChartOptions = {
    data: [
        { category: 'Q1', apples: 5, oranges: 3 },
        { category: 'Q2', apples: 7, oranges: 4 },
        { category: 'Q3', apples: 6, oranges: 5 },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left', gridLine: { enabled: false } },
    },
    series: [
        { type: 'bar', xKey: 'category', yKey: 'apples' },
        { type: 'bar', xKey: 'category', yKey: 'oranges' },
    ],
};

/** `options` on a white background, without a legend unless they enable one, with highlight changes fading. */
export function gradualHighlightOptions<T extends AgChartOptions>(options: T): T {
    return {
        background: { fill: '#ffffff' },
        legend: { enabled: false },
        ...options,
        highlight: { ...options.highlight, transitionMode: 'gradual' },
    };
}

type Point = { x: number; y: number };

/** How long a highlight fade lasts at the chart's animation duration. */
export function fadeDuration(chart: ChartOrProxy<any>) {
    return STYLE_TRANSITION * deproxy(chart).ctx.animationManager.defaultDuration;
}

function seriesOrigin(chart: ChartOrProxy<any>): Point {
    const { seriesRect } = deproxy(chart);
    expect(seriesRect).toBeDefined();
    return seriesRect!;
}

export interface HighlightFadeCase {
    name: string;
    /** A chart on a white background whose items render opaque at their centres. */
    options: AgChartOptions;
    /** Where an item renders on the canvas. */
    itemCentre: (chart: ChartOrProxy<any>, seriesIndex: number, datumIndex: number) => Point;
}

export function rectCentre(chart: ChartOrProxy<any>, seriesIndex: number, datumIndex: number): Point {
    const { x, y, width, height } = getDatumCanvasBounds(chart, seriesIndex, datumIndex);
    return { x: x + width / 2, y: y + height / 2 };
}

export function markerCentre(chart: ChartOrProxy<any>, seriesIndex: number, datumIndex: number): Point {
    const { point } = getSeriesNodeData<{ point: Point }>(chart, seriesIndex)[datumIndex];
    const origin = seriesOrigin(chart);
    return { x: origin.x + point.x, y: origin.y + point.y };
}

export function sectorCentre(chart: ChartOrProxy<any>, seriesIndex: number, datumIndex: number): Point {
    const { innerRadius, outerRadius, startAngle, endAngle } = getSeriesNodeData<{
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
    }>(chart, seriesIndex)[datumIndex];
    const center = getPolarSeriesCenter(chart, seriesIndex);
    const origin = seriesOrigin(chart);
    const radius = (innerRadius + outerRadius) / 2;
    const angle = (startAngle + endAngle) / 2;
    return { x: origin.x + center.x + radius * Math.cos(angle), y: origin.y + center.y + radius * Math.sin(angle) };
}

/**
 * Registers the mocks a fade test needs and returns its chart helpers. `create` replaces the chart, applying
 * `gradualHighlightOptions` unless told not to; `shown` reads the opacity an item is seen at, whichever nodes draw it.
 */
export function setupHighlightFade(
    createChart: (options: AgChartOptions) => Promise<AgChartInstance>,
    itemCentre: HighlightFadeCase['itemCentre'] = rectCentre
) {
    setupMockConsole();
    setupMockCanvas();
    playTransitionAnimations();
    const frames = spyOnAnimationFrames();

    let current: AgChartInstance | undefined;
    /** The colour each item renders with at full opacity, by series then datum. */
    let opaque: number[][][] = [];

    afterEach(() => {
        current?.destroy();
        current = undefined;
    });

    const proxy = () => {
        expect(current).toBeDefined();
        return current!;
    };
    const chart = () => deproxy(proxy());
    const datum = (seriesIndex: number, datumIndex: number) =>
        getSeriesNodeData<HighlightNodeDatum>(proxy(), seriesIndex)[datumIndex];
    const pixel = (seriesIndex: number, datumIndex: number) => {
        const { x, y } = itemCentre(proxy(), seriesIndex, datumIndex);
        return renderedPixelAt(proxy(), x, y);
    };
    const shown = (seriesIndex: number, datumIndex: number) =>
        shownOpacity(pixel(seriesIndex, datumIndex), opaque[seriesIndex][datumIndex], WHITE);
    const highlight = (highlighted?: HighlightNodeDatum) =>
        chart().ctx.highlightManager.updateHighlight(chart().id, highlighted);
    // The first frame only starts the clock, so the last lands beyond the fade's end.
    const capture = <T>(sampler: () => T, durationMs = fadeDuration(proxy())) =>
        frames.captureAnimationFrames(proxy(), sampler, { frames: 10, duration: durationMs + 100, rendered: true });

    const create = async (options: AgChartOptions, { gradual = true } = {}) => {
        current?.destroy();
        current = await createChart(gradual ? gradualHighlightOptions(options) : options);
        await frames.runToEnd(current);
        await deproxy(current).waitForUpdate();
        opaque = chart().series.map((_, seriesIndex) =>
            getSeriesNodeData(proxy(), seriesIndex).map((__, datumIndex) => pixel(seriesIndex, datumIndex))
        );
    };

    return { frames, proxy, chart, datum, pixel, shown, highlight, capture, create };
}

/**
 * The highlight fades every series shares, read from rendered pixels. Every series dims its unhighlighted items, so
 * the item sampled for dimming is in the last series: another series where there are two, else the same one.
 */
export function describeHighlightFade(
    cases: HighlightFadeCase[],
    createChart: (options: AgChartOptions) => Promise<AgChartInstance>
) {
    describe.each(cases)('$name highlight fade', ({ options, itemCentre }) => {
        const { frames, proxy, chart, datum, pixel, shown, highlight, capture, create } = setupHighlightFade(
            createChart,
            itemCentre
        );
        const otherSeries = () => chart().series.length - 1;

        beforeEach(async () => {
            await create({
                ...options,
                series: options.series?.map((series) => ({
                    ...series,
                    highlight: { unhighlightedItem: UNHIGHLIGHTED_ITEM },
                })),
            } as AgChartOptions);
        });

        it('fades the other items when an item is highlighted', async () => {
            expect(pixel(otherSeries(), 0)).not.toEqual(WHITE);
            highlight(datum(0, 1));
            const trajectory = await capture(() => shown(otherSeries(), 0));

            expect(trajectory.at(-1)).toBeLessThan(1);
            expectFade(trajectory, 1, trajectory.at(-1)!);
        });

        it('fades the items back when the highlight is removed', async () => {
            highlight(datum(0, 1));
            await frames.runToEnd(proxy());
            const dimmed = shown(otherSeries(), 0);

            highlight();
            const trajectory = await capture(() => shown(otherSeries(), 0));

            expectFade(trajectory, dimmed, 1);
        });

        it('fades the item losing the highlight when it moves to another item', async () => {
            highlight(datum(0, 1));
            await frames.runToEnd(proxy());

            highlight(datum(0, 2));
            const trajectory = await capture(() => shown(0, 1));

            expect(trajectory.at(-1)).toBeLessThan(1);
            expectFade(trajectory, 1, trajectory.at(-1)!);
        });
    });
}
