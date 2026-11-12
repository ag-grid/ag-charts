import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

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

const WHITE = [255, 255, 255, 255];
const UNHIGHLIGHTED_ITEM = { fillOpacity: 0.4, strokeOpacity: 0.4 };

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
 * The highlight fades every series shares, read from rendered pixels. Every series dims its unhighlighted items, so
 * the item sampled for dimming is in the last series: another series where there are two, else the same one.
 */
export function describeHighlightFade(
    cases: HighlightFadeCase[],
    createChart: (options: AgChartOptions) => Promise<AgChartInstance>
) {
    describe.each(cases)('$name highlight fade', ({ options, itemCentre }) => {
        setupMockConsole();
        setupMockCanvas();
        playTransitionAnimations();
        const frames = spyOnAnimationFrames();

        let proxy: AgChartInstance;
        /** The colour each item renders with at full opacity, by series then datum. */
        let opaque: number[][][];

        afterEach(() => {
            proxy?.destroy();
        });

        const chart = () => deproxy(proxy);
        const datum = (seriesIndex: number, datumIndex: number) =>
            getSeriesNodeData<HighlightNodeDatum>(proxy, seriesIndex)[datumIndex];
        const pixel = (seriesIndex: number, datumIndex: number) => {
            const { x, y } = itemCentre(proxy, seriesIndex, datumIndex);
            return renderedPixelAt(proxy, x, y);
        };
        /** The opacity an item is seen at, whichever nodes draw it. */
        const shown = (seriesIndex: number, datumIndex: number) =>
            shownOpacity(pixel(seriesIndex, datumIndex), opaque[seriesIndex][datumIndex], WHITE);
        const highlight = (highlighted?: HighlightNodeDatum) =>
            chart().ctx.highlightManager.updateHighlight(chart().id, highlighted);
        const otherSeries = () => chart().series.length - 1;

        const capture = <T>(sampler: () => T) =>
            frames.captureAnimationFrames(proxy, sampler, {
                frames: 10,
                duration: fadeDuration(proxy) + 100,
                rendered: true,
            });

        const create = async () => {
            proxy = await createChart({
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
            opaque = chart().series.map((_, seriesIndex) =>
                getSeriesNodeData(proxy, seriesIndex).map((__, datumIndex) => pixel(seriesIndex, datumIndex))
            );
        };

        it('fades the other items when an item is highlighted', async () => {
            await create();
            expect(opaque[otherSeries()][0]).not.toEqual(WHITE);

            highlight(datum(0, 1));
            const trajectory = await capture(() => shown(otherSeries(), 0));

            expect(trajectory.at(-1)).toBeLessThan(1);
            expectFade(trajectory, 1, trajectory.at(-1)!);
        });

        it('fades the items back when the highlight is removed', async () => {
            await create();
            highlight(datum(0, 1));
            await frames.runToEnd(proxy);
            const dimmed = shown(otherSeries(), 0);

            highlight();
            const trajectory = await capture(() => shown(otherSeries(), 0));

            expectFade(trajectory, dimmed, 1);
        });

        it('fades the item losing the highlight when it moves to another item', async () => {
            await create();
            highlight(datum(0, 1));
            await frames.runToEnd(proxy);

            highlight(datum(0, 2));
            const trajectory = await capture(() => shown(0, 1));

            expect(trajectory.at(-1)).toBeLessThan(1);
            expectFade(trajectory, 1, trajectory.at(-1)!);
        });
    });
}
