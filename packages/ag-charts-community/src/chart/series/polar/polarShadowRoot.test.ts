import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import { getSeriesNodeData } from '../../test/seriesAccessors';
import { HIGHLIGHT_GLOW, SERIES_GLOW } from '../../test/shadowFixtures';
import {
    type Chart,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A shadow with no blur, so that a pixel is lit by a shadow or it is not. The offset carries it onto the ring around.
const SHADOW: AgDropShadowOptions = { enabled: true, fill: 'rgba(0, 0, 0, 0.5)', xOffset: 24, yOffset: 24, blur: 0 };

const RED = [255, 0, 0, 255];

const RINGS_DATA = [
    { category: 'A', outer: 7, inner: 4.2, innerFiltered: 1.2 },
    { category: 'B', outer: 4.3, inner: 8.5, innerFiltered: 3 },
    { category: 'C', outer: 3, inner: 3, innerFiltered: 1 },
    { category: 'D', outer: 6.5, inner: 4.3, innerFiltered: 2 },
];

describe('polar series shadow root', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        chart?.destroy();
        chart = deproxy(await createChart({ animation: { enabled: false }, legend: { enabled: false }, ...options }));
        await waitForChartStability(chart);
        return chart;
    };

    const pixels = () => {
        const { canvas } = chart!.ctx.scene;
        return Array.from(canvas.context.getImageData(0, 0, canvas.width, canvas.height).data as ArrayLike<number>);
    };

    /**
     * Draws the chart without any shadow, then with the one the series that `build` makes cast. Returns what each pixel that
     * the plain chart draws as one of the opaque `fills` is after the shadow, so that a test can tell whether the shadow
     * lands on a fill that is beneath it.
     */
    const fillPixelsAfterCasting = async (
        fills: number[][],
        build: (shadow: AgDropShadowOptions | undefined) => AgChartOptions
    ) => {
        await create(build(undefined));
        const plain = pixels();
        const opaque: number[] = [];
        for (let i = 0; i < plain.length; i += 4) {
            if (fills.some((fill) => fill.every((channel, c) => plain[i + c] === channel))) opaque.push(i);
        }
        expect(opaque.length).toBeGreaterThan(100);

        await create(build(SHADOW));
        const shadowed = pixels();
        expect(shadowed.some((value, i) => value !== plain[i])).toBe(true);
        return opaque.map((i) => [0, 1, 2, 3].every((c) => shadowed[i + c] === plain[i + c]));
    };

    describe('phantom sectors', () => {
        // The outer ring is drawn first, and the inner ring's phantoms, drawn after it, would cast onto it if they cast their own shadows.
        const phantomRings = (shadow: AgDropShadowOptions | undefined) =>
            ({
                data: RINGS_DATA,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'outer',
                        outerRadiusRatio: 1,
                        innerRadiusRatio: 0.7,
                        fills: ['red'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                    },
                    {
                        type: 'donut',
                        angleKey: 'inner',
                        angleFilterKey: 'innerFiltered',
                        outerRadiusRatio: 0.65,
                        innerRadiusRatio: 0.3,
                        fills: ['blue'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the shadows of phantom sectors over the ring around them', async () => {
            const fills = await fillPixelsAfterCasting([RED], phantomRings);

            expect(fills.every(Boolean)).toBe(true);
        });
    });

    describe('phantom sector glows', () => {
        // The items of each datum reach about half of the radius of its phantom, so a glow beyond the phantoms is theirs.
        const glowOptions = (glow: AgGlowOptions | undefined, highlightedGlow?: AgGlowOptions): AgChartOptions => {
            // `angleFilterKey` is not in the public types.
            const series: object = {
                type: 'donut',
                angleKey: 'inner',
                angleFilterKey: 'innerFiltered',
                fills: ['blue'],
                fillOpacity: 1,
                strokeWidth: 0,
                glow,
                highlight: { highlightedItem: { glow: highlightedGlow } },
            };
            return { data: RINGS_DATA, series: [series] } as AgChartOptions;
        };

        /** The positions of the pixels that differ from the chart without glows, from the centre of the chart. */
        const glowDistances = async (hover: boolean) => {
            await create(glowOptions(undefined));
            const plain = pixels();
            const { width, height } = chart!.ctx.scene.canvas;
            const drawn = (i: number) => plain[i] !== 255 || plain[i + 1] !== 255 || plain[i + 2] !== 255;
            let [minX, maxX, minY, maxY] = [width, 0, height, 0];
            for (let i = 0; i < plain.length; i += 4) {
                if (!drawn(i)) continue;
                const [x, y] = [(i / 4) % width, Math.floor(i / 4 / width)];
                [minX, maxX, minY, maxY] = [Math.min(minX, x), Math.max(maxX, x), Math.min(minY, y), Math.max(maxY, y)];
            }
            const [cx, cy, radius] = [(minX + maxX) / 2, (minY + maxY) / 2, (maxX - minX) / 2];

            await create(glowOptions(SERIES_GLOW, HIGHLIGHT_GLOW));
            if (hover) {
                const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart!);
                chart!.ctx.highlightManager.updateHighlight(chart!.id, datum);
                await waitForChartStability(chart!);
            }
            const glowing = pixels();
            const distances: number[] = [];
            for (let i = 0; i < glowing.length; i += 4) {
                if ([0, 1, 2, 3].every((c) => glowing[i + c] === plain[i + c])) continue;
                const [x, y] = [(i / 4) % width, Math.floor(i / 4 / width)];
                distances.push(Math.hypot(x - cx, y - cy) - radius);
            }
            return distances;
        };

        it.each([
            ['at rest', false],
            ['while an item is hovered', true],
        ])('should cast no glow beyond the phantoms %s', async (_name, hover) => {
            const distances = await glowDistances(hover);

            expect(distances.length).toBeGreaterThan(100);
            expect(distances.filter((distance) => distance > 1)).toEqual([]);
        });
    });

    describe('neighbouring slices', () => {
        // The slices of one series are one batch, whose shadows lie beneath every slice: none of them shadows another.
        it('should not draw the shadow of a slice over the slice beside it', async () => {
            const fills = await fillPixelsAfterCasting(
                [
                    [255, 0, 0, 255],
                    [0, 0, 255, 255],
                    [0, 128, 0, 255],
                    [255, 165, 0, 255],
                ],
                (shadow) => ({
                    data: RINGS_DATA,
                    series: [
                        {
                            type: 'pie',
                            angleKey: 'outer',
                            fills: ['red', 'blue', 'green', 'orange'],
                            fillOpacity: 1,
                            strokeWidth: 0,
                            shadow,
                        },
                    ],
                })
            );

            expect(fills.every(Boolean)).toBe(true);
        });
    });
});
