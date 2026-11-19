import { afterEach, describe, expect, it } from 'vitest';

import { type Group, Sector } from 'ag-charts-core';
import type { AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-types';

import { canvasImage, hoverDatum } from '../../test/glowRender';
import { getSeriesAt } from '../../test/seriesAccessors';
import { HIGHLIGHT_GLOW, SERIES_GLOW, shapesOf } from '../../test/shadowFixtures';
import {
    type Chart,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A shadow with no blur, so that a pixel is lit by a shadow or it is not. The offset carries it onto the ring around.
const SHADOW_STRENGTH = 0.5;
const SHADOW: AgDropShadowOptions = {
    enabled: true,
    fill: `rgba(0, 0, 0, ${SHADOW_STRENGTH})`,
    xOffset: 24,
    yOffset: 24,
    blur: 0,
};

/** The opacity that the donut draws its phantoms at. */
const PHANTOM_OPACITY = 0.2;

const RED = [255, 0, 0, 255];
const BLUE = [0, 0, 255, 255];

const RINGS_DATA = [
    { category: 'A', outer: 7, inner: 4.2, innerFiltered: 1.2 },
    { category: 'B', outer: 4.3, inner: 8.5, innerFiltered: 3 },
    { category: 'C', outer: 3, inner: 3, innerFiltered: 1 },
    { category: 'D', outer: 6.5, inner: 4.3, innerFiltered: 2 },
];

/** One donut whose items reach about half of the radius of their phantoms. `angleFilterKey` is not in the public types. */
function filteredDonut(series: object = {}): AgChartOptions {
    const donut: object = {
        type: 'donut',
        angleKey: 'inner',
        angleFilterKey: 'innerFiltered',
        fills: ['blue'],
        fillOpacity: 1,
        strokeWidth: 0,
        ...series,
    };
    return { data: RINGS_DATA, series: [donut] } as AgChartOptions;
}

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

    const pixels = () => Array.from(canvasImage(chart!).data);

    /** For each pixel that the chart draws as one of the opaque `fills`, whether the shadow left it as it was. */
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

    /** The centre and radius of the phantoms of the chart that is drawn, which cover its whole disc. */
    const phantomDisc = (plain: number[]) => {
        const { width, height } = chart!.ctx.scene.canvas;
        let [minX, maxX, minY, maxY] = [width, 0, height, 0];
        for (let i = 0; i < plain.length; i += 4) {
            if (plain[i] === 255 && plain[i + 1] === 255 && plain[i + 2] === 255) continue;
            const [x, y] = [(i / 4) % width, Math.floor(i / 4 / width)];
            [minX, maxX, minY, maxY] = [Math.min(minX, x), Math.max(maxX, x), Math.min(minY, y), Math.max(maxY, y)];
        }
        return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, radius: (maxX - minX) / 2, width };
    };

    describe('phantom sector shadows', () => {
        // The outer ring is drawn first, and the phantoms of the inner ring would shadow it if they cast their own shadows.
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
                        ...(filteredDonut().series as object[])[0],
                        outerRadiusRatio: 0.65,
                        innerRadiusRatio: 0.3,
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it.each([
            ['the ring around them', [RED], phantomRings],
            ['the sectors beside them', [BLUE], (shadow?: AgDropShadowOptions) => filteredDonut({ shadow })],
            [
                'the slice beside it, in a pie',
                [RED, BLUE, [0, 128, 0, 255], [255, 165, 0, 255]],
                (shadow?: AgDropShadowOptions) =>
                    ({
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
                    }) as AgChartOptions,
            ],
        ])('should not draw a shadow over %s', async (_name, fills, build) => {
            expect((await fillPixelsAfterCasting(fills, build)).every(Boolean)).toBe(true);
        });

        it('should cast the shadow of a phantom, once where it falls on that of an item', async () => {
            await create(filteredDonut());
            const plain = pixels();
            const { cx, cy, radius, width } = phantomDisc(plain);
            await create(filteredDonut({ shadow: SHADOW }));
            const shadowed = pixels();
            const at = (x: number, y: number) =>
                shadowed.slice(4 * (Math.round(y) * width + Math.round(x))).slice(0, 3);

            // Beyond the items and the phantoms, down and right, only the shadow of a phantom reaches.
            const beyond = radius + 12;
            const phantomOnly = 255 * (1 - SHADOW_STRENGTH * PHANTOM_OPACITY);
            const diagonal = Math.SQRT1_2 * beyond;
            for (const channel of at(cx + diagonal, cy + diagonal)) expect(channel).toBeCloseTo(phantomOnly, -0.5);

            // Where the shadows of an item and its phantom overlap, they are one cast, as strong as the item's alone.
            const itemOnly = [255, 255, 255].map(
                (channel, c) => channel * (1 - SHADOW_STRENGTH) * (1 - PHANTOM_OPACITY) + BLUE[c] * PHANTOM_OPACITY
            );
            const overlapped = [];
            for (let i = 0; i < plain.length; i += 4) {
                if (plain[i] === 204 && plain[i + 1] === 204 && plain[i + 2] === 255)
                    overlapped.push(shadowed.slice(i, i + 3));
            }
            const single = overlapped.filter((pixel) =>
                pixel.every((channel, c) => Math.abs(channel - itemOnly[c]) <= 2)
            );
            expect(single.length).toBeGreaterThan(1000);
        });

        // A highlighted phantom's shadow is not visible apart from a batched one's, so the group that casts it is checked.
        it('should cast the shadows of phantoms in both groups as their items and highlight copies do', async () => {
            await create(filteredDonut({ shadow: SHADOW }));
            await hoverDatum(chart!);

            const { contentGroup, highlightGroup } = getSeriesAt(chart!);
            const groupsOf = (root: Group, phantom: boolean) =>
                new Set(
                    shapesOf(root, Sector)
                        .filter((shape) => ((shape.parentNode as Group).name === 'phantom') === phantom)
                        .map((shape) => (shape.parentNode as Group).batchShadows)
                );

            expect(groupsOf(contentGroup, false)).toEqual(new Set(['shared']));
            expect(groupsOf(contentGroup, true)).toEqual(new Set(['shared']));
            expect(groupsOf(highlightGroup, false)).toEqual(new Set([true]));
            expect(groupsOf(highlightGroup, true)).toEqual(new Set([true]));
        });
    });

    describe('phantom sector glows', () => {
        /** The distances beyond the phantoms of the pixels that the glows change, which only a phantom's glow can reach. */
        const glowDistances = async (hover: boolean) => {
            await create(filteredDonut());
            const plain = pixels();
            const { cx, cy, radius, width } = phantomDisc(plain);

            const glow: AgGlowOptions = SERIES_GLOW;
            const highlightedItem: AgGlowOptions = HIGHLIGHT_GLOW;
            await create(filteredDonut({ glow, highlight: { highlightedItem: { glow: highlightedItem } } }));
            if (hover) await hoverDatum(chart!);
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
});
