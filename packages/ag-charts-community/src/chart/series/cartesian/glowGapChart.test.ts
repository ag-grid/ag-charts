import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { expectSamePixels } from '../../test/expectSamePixels';
import { bytesOf, pixelsAroundCircle, visibleItems } from '../../test/glowRender';
import { FADING_FILL, TRANSPARENT_PATTERN } from '../../test/shadowFixtures';
import {
    type Chart,
    chartPixelAt,
    createChart,
    deproxy,
    expectWarningMessages,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A glow with a spread of 10 and no blur, so that a pixel is in it or out of it: it starts a `gap` past the edge of an item
// and ends 10px further out.
const glow = (gap?: number) => ({ blur: 0, spread: 10, fill: 'red', fillOpacity: 1, gap });

// The item is half-opaque blue on a white chart, and a glow with a `fillOpacity` of 1 is solid red beside it. Where the glow is
// beneath the item, the item is purple over it, with less green than the lavender of the item over white.
const WHITE = [255, 255, 255, 255];
/** The glow beside the item: red at the strength that it is set to. */
const GLOW_RED = [255, 0, 0, 255];
const TRANSLUCENT_ITEM = { fill: 'blue', fillOpacity: 0.5, strokeWidth: 0 };
const LAVENDER_GREEN = 128;
/** Where the hovered item is drawn over itself, as `drawingMode: 'overlay'` does, it is half-opaque twice over: a quarter as green. */
const OVER_ITSELF_GREEN = Math.round(255 * (1 - TRANSLUCENT_ITEM.fillOpacity) ** 2);
/** What the theme dims the other items and series to, set so that the pixels of the tests don't follow the theme's defaults. */
const HIGHLIGHT_OPACITIES = {
    highlightedSeries: { opacity: 1 },
    unhighlightedItem: { opacity: 1 },
    unhighlightedSeries: { opacity: 1 },
};

/** Whether the pixel is reddened: a glow is cast on it. */
const isGlowing = (pixel: number[]) => pixel[0] === 255 && pixel[1] < 255;
/** Whether the item is over white, as a glow that is cut out of the footprint of the item leaves it. */
const isClear = (pixel: number[]) => Math.abs(pixel[1] - LAVENDER_GREEN) <= 2 && pixel[2] === 255;
/** Whether the item is over itself and not over its glow, which would darken it further. */
const isOverItself = (pixel: number[]) => Math.abs(pixel[1] - OVER_ITSELF_GREEN) <= 2 && pixel[2] === 255;

describe('glow gap in a chart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        chart?.destroy();
        const created = deproxy(
            await createChart({ animation: { enabled: false }, legend: { enabled: false }, ...options })
        );
        chart = created;
        await waitForChartStability(created);
        return created;
    };

    const pixelAt = (x: number, y: number) => chartPixelAt(chart!, x, y);

    const firstItem = () => visibleItems(chart!)[0];

    /** The pixel `distance` to the right of the first item, along the line across its middle, which is inside it if negative. */
    const rightOfFirstItem = () => {
        const { x, y, width, height } = firstItem();
        return (distance: number) => pixelAt(x + width + distance, y + height / 2);
    };

    const hoverFirst = async () => {
        const { x, y, width, height } = firstItem();
        await hoverAction(x + width / 2, y + height / 2)(chart!);
        await waitForChartStability(chart!);
    };

    const bars = ({
        highlight,
        ...options
    }: {
        highlight?: object;
        [option: string]: unknown;
    }): AgCartesianChartOptions => ({
        data: [{ category: 'A', value: 8 }],
        series: [
            {
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                ...TRANSLUCENT_ITEM,
                highlight: { ...HIGHLIGHT_OPACITIES, ...highlight },
                ...options,
            },
        ],
    });

    const markers = ({
        highlight,
        ...options
    }: {
        highlight?: object;
        [option: string]: unknown;
    }): AgCartesianChartOptions => ({
        data: [{ x: 5, y: 5 }],
        series: [
            {
                type: 'scatter',
                xKey: 'x',
                yKey: 'y',
                size: 40,
                shape: 'square',
                ...TRANSLUCENT_ITEM,
                highlight: { ...HIGHLIGHT_OPACITIES, ...highlight },
                ...options,
            },
        ],
    });

    // The glow is cast by the series on every item, or by the highlight copy of the hovered one, which is drawn the same.
    // The hovered copy casts its own glow when it is a cutout, through the highlight group's batch when it is drawn over the item
    // beneath, and through the series' glow overlay when it is not brought to the front.
    describe.each([
        { name: 'bar', build: (gap?: number) => bars({ glow: glow(gap) }), hovered: false, inside: isClear },
        {
            name: 'scatter marker',
            build: (gap?: number) => markers({ glow: glow(gap) }),
            hovered: false,
            inside: isClear,
        },
        {
            name: 'bar, hovered and cast by its highlight copy',
            build: (gap?: number) => bars({ highlight: { highlightedItem: { glow: glow(gap) } } }),
            hovered: true,
            inside: isClear,
        },
        {
            name: 'bar, hovered with no bringToFront',
            build: (gap?: number) => bars({ highlight: { bringToFront: false, highlightedItem: { glow: glow(gap) } } }),
            hovered: true,
            inside: isClear,
        },
        {
            name: 'bar, hovered and drawn over the item beneath',
            build: (gap?: number): AgCartesianChartOptions => ({
                ...bars({ highlight: { highlightedItem: { glow: glow(gap) } } }),
                highlight: { drawingMode: 'overlay' as const },
            }),
            hovered: true,
            inside: isOverItself,
        },
        {
            name: 'scatter marker, hovered and drawn over the item beneath',
            build: (gap?: number): AgCartesianChartOptions => ({
                ...markers({ highlight: { highlightedItem: { glow: glow(gap) } } }),
                highlight: { drawingMode: 'overlay' as const },
            }),
            hovered: true,
            inside: isOverItself,
        },
    ])('around a $name', ({ build, hovered, inside }) => {
        const createAndHover = async (gap?: number) => {
            await create(build(gap));
            if (hovered) await hoverFirst();
            return rightOfFirstItem();
        };

        if (hovered) {
            it('should cast no glow until the item is hovered', async () => {
                await create(build(0));

                expect(rightOfFirstItem()(3)).toEqual(WHITE);
            });
        }

        it('should cast a glow with no gap that the translucent item that glows is cut out of, hovered or not', async () => {
            const at = await createAndHover();

            expect(isGlowing(at(3))).toBe(true);
            expect(at(3)).toEqual(GLOW_RED);
            expect(at(8)).toEqual(GLOW_RED);
            expect(inside(at(-10))).toBe(true);
        });

        it('should keep the glow out of the item with a gap of 0, and cast it as far out as with no gap', async () => {
            const at = await createAndHover(0);

            expect(inside(at(-10))).toBe(true);
            expect(at(3)).toEqual(GLOW_RED);
            expect(at(8)).toEqual(GLOW_RED);
            expect(at(15)).toEqual(WHITE);
        });

        it('should start the glow a gap past the item and end it a spread further out', async () => {
            const at = await createAndHover(5);

            expect(inside(at(-10))).toBe(true);
            expect(at(2)).toEqual(WHITE);
            expect(isGlowing(at(8))).toBe(true);
            expect(isGlowing(at(13))).toBe(true);
            expect(at(18)).toEqual(WHITE);
        });
    });

    // What a hovered item with no `gap` renders outside its footprint is pinned beside it, as #9221's head rendered it before the
    // footprint of a see-through item was cut: the glow ring and, for an opaque item, its anti-aliased edge. They are the
    // pixels at `DISTANCES` from the edge of a 40px item, at `ANGLES` (degrees, anticlockwise from the right), spread 10 and blur 6.
    describe('the footprint of the hovered item, with no gap', () => {
        const HOVERED_GLOW = { fill: 'red', fillOpacity: 1, blur: 6, spread: 10 };
        const SPREAD_0_GLOW = { fill: 'red', fillOpacity: 1, blur: 8, spread: 0 };
        const BLUE_SQUARES = { ...TRANSPARENT_PATTERN, fill: 'blue', fillOpacity: 1 };
        // The same render differs by 1/255 between hosts, so a pin of bytes holds within 2, which the regressions it guards exceed.
        const PIN_TOLERANCE = 2;
        const ALL_ANGLES = [0, 45, 90, 200];
        const EDGE_DISTANCES = [-1, 0, 0.5, 1];
        const RING_DISTANCES = [2, 4, 8, 12];
        const EDGE_OF_OPAQUE_CIRCLE = [
            [7, 0, 248, 255],
            [0, 0, 255, 255],
            [0, 0, 255, 255],
            [0, 0, 255, 255],
            [255, 0, 0, 255],
            [143, 0, 111, 255],
            [0, 0, 255, 255],
            [71, 0, 184, 255],
            [255, 0, 0, 255],
            [143, 0, 111, 255],
            [127, 0, 128, 255],
            [178, 0, 77, 255],
            [255, 0, 0, 255],
            [255, 0, 0, 255],
            [127, 0, 128, 255],
            [255, 0, 0, 255],
        ];
        const RING_OF_CIRCLE = [
            [255, 2, 2, 255],
            [255, 2, 2, 255],
            [255, 0, 0, 255],
            [255, 1, 1, 255],
            [255, 13, 13, 255],
            [255, 7, 7, 255],
            [255, 3, 3, 255],
            [255, 10, 10, 255],
            [255, 91, 91, 255],
            [255, 74, 74, 255],
            [249, 47, 48, 255],
            [255, 59, 59, 255],
            [255, 204, 204, 255],
            [255, 198, 198, 255],
            [235, 150, 156, 255],
            [255, 178, 178, 255],
        ];
        const RING_OF_FADING_SQUARE = [
            [255, 183, 183, 255],
            [235, 149, 154, 255],
            [255, 139, 139, 255],
            [255, 218, 218, 255],
            [230, 185, 192, 255],
            [255, 183, 183, 255],
            [255, 251, 251, 255],
            [225, 226, 233, 255],
            [255, 230, 230, 255],
            [255, 255, 255, 255],
            [224, 234, 242, 255],
            [255, 253, 253, 255],
        ];

        const hovered = (series: object, glowOptions: object, mode: 'overlay' | 'cutout'): AgChartOptions => ({
            highlight: { drawingMode: mode },
            data: [{ x: 5, y: 5 }],
            series: [
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    size: 40,
                    strokeWidth: 0,
                    ...series,
                    glow: glowOptions,
                    highlight: { ...HIGHLIGHT_OPACITIES, highlightedItem: { glow: glowOptions } },
                },
            ] as AgCartesianChartOptions['series'],
        });

        /** The pixels `distances` from the edge of the first item, at each of `angles`, taking the item as a circle. */
        const around = (distances: number[], angles: number[]) =>
            pixelsAroundCircle(chart!, firstItem(), distances, angles);

        const createHovered = async (options: AgChartOptions) => {
            await create(options);
            await hoverFirst();
        };

        /** The pixels `distances` out of the hovered item, and those at the same places with the glow turned off, to see its own colour. */
        const hoveredAndWithNoGlow = async (
            series: object,
            glowOptions: object,
            mode: 'overlay' | 'cutout',
            distances: number[],
            angles: number[]
        ) => {
            await createHovered(hovered(series, glowOptions, mode));
            const withGlow = around(distances, angles);
            await createHovered(hovered(series, { enabled: false }, mode));
            return { withGlow, withNoGlow: around(distances, angles) };
        };

        describe.each(['overlay', 'cutout'] as const)('drawn as %s', (mode) => {
            it('should leave an opaque item as it is, to its edge', async () => {
                await createHovered(hovered({ shape: 'circle', fill: 'blue', fillOpacity: 1 }, HOVERED_GLOW, mode));

                expectSamePixels(
                    bytesOf([...around(EDGE_DISTANCES, ALL_ANGLES), ...around(RING_DISTANCES, ALL_ANGLES)]),
                    bytesOf([...EDGE_OF_OPAQUE_CIRCLE, ...RING_OF_CIRCLE]),
                    PIN_TOLERANCE
                );
            });

            it('should keep a translucent item its own colour, and leave the glow beside it as it is', async () => {
                const series = { shape: 'circle', fill: 'blue', fillOpacity: 0.4 };
                const { withGlow, withNoGlow } = await hoveredAndWithNoGlow(
                    series,
                    HOVERED_GLOW,
                    mode,
                    [-10, -3],
                    [0, 90, 200]
                );

                expectSamePixels(bytesOf(withGlow), bytesOf(withNoGlow), 2);
                await createHovered(hovered(series, HOVERED_GLOW, mode));
                expectSamePixels(bytesOf(around(RING_DISTANCES, ALL_ANGLES)), bytesOf(RING_OF_CIRCLE), PIN_TOLERANCE);
            });

            it('should keep a gradient that fades to transparent its own colour with no spread, and leave the glow beside it as it is', async () => {
                const series = { shape: 'square', fill: FADING_FILL, fillOpacity: 1 };
                const { withGlow, withNoGlow } = await hoveredAndWithNoGlow(
                    series,
                    SPREAD_0_GLOW,
                    mode,
                    [-10, -3],
                    [0, 90, 200]
                );

                expectSamePixels(bytesOf(withGlow), bytesOf(withNoGlow), 2);
                await createHovered(hovered(series, SPREAD_0_GLOW, mode));
                expectSamePixels(
                    bytesOf(around(RING_DISTANCES, [0, 90, 200])),
                    bytesOf(RING_OF_FADING_SQUARE),
                    PIN_TOLERANCE
                );
            });

            it('should keep a pattern with a transparent background its own colour with no spread, and leave the glow beside it as it is', async () => {
                const series = { shape: 'square', fill: BLUE_SQUARES, fillOpacity: 1 };
                // The squares of the pattern hide the glow beneath them, so it is the gaps between them that tell the cut.
                const { withGlow, withNoGlow } = await hoveredAndWithNoGlow(
                    series,
                    SPREAD_0_GLOW,
                    mode,
                    [-18, -14, -10, -6, -2],
                    [0, 45, 90, 135, 180, 225, 270, 315]
                );

                expectSamePixels(bytesOf(withGlow), bytesOf(withNoGlow), 2);
                await createHovered(hovered(series, SPREAD_0_GLOW, mode));
                expect(around([3], [0])[0]).not.toEqual(WHITE);
            });

            it('should keep an opaque fill under a translucent stroke its own colour', async () => {
                const series = {
                    shape: 'circle',
                    fill: 'blue',
                    fillOpacity: 1,
                    stroke: 'green',
                    strokeWidth: 6,
                    strokeOpacity: 0.4,
                };
                await createHovered(hovered(series, HOVERED_GLOW, mode));
                const withGlow = around([-8, 1], [0, 90]);
                await createHovered(hovered(series, { enabled: false }, mode));

                expectSamePixels(bytesOf(withGlow), bytesOf(around([-8, 1], [0, 90])), 2);
            });

            it('should keep an opaque bar at half opacity its own colour', async () => {
                const options = (glowOptions: object): AgChartOptions => ({
                    ...bars({ fillOpacity: 1, highlight: { highlightedItem: { opacity: 0.5, glow: glowOptions } } }),
                    highlight: { drawingMode: mode },
                });
                await createHovered(options(glow()));
                const withGlow = rightOfFirstItem()(-10);
                await createHovered(options({ enabled: false }));

                expectSamePixels(bytesOf([withGlow]), bytesOf([rightOfFirstItem()(-10)]), 2);
            });
        });
    });

    describe('around the hovered item, cast by its highlight copy', () => {
        it.each([
            ['let a highlight gap of 0 clear a series gap', { gap: 0 }, GLOW_RED],
            ['inherit the series gap where the bucket sets none', { blur: 0 }, WHITE],
        ])('should %s', async (_name, bucket, expected) => {
            await create(bars({ glow: glow(5), highlight: { highlightedItem: { glow: bucket } } }));
            await hoverFirst();

            expect(rightOfFirstItem()(2)).toEqual(expected);
        });
    });

    describe('with the spread at 0', () => {
        // The blur of the glow reaches 12px past the item, so a probe 40px out is clear of it.
        const blurred = (gap?: number) => bars({ glow: { blur: 8, spread: 0, fill: 'red', fillOpacity: 1, gap } });

        it('should cast a glow with no gap that the item that glows is cut out of, and which reaches only as far as its blur', async () => {
            await create(blurred());
            const at = rightOfFirstItem();

            expect(isGlowing(at(2))).toBe(true);
            expect(at(40)).toEqual(WHITE);
            expect(isClear(at(-10))).toBe(true);
        });

        it('should keep a glow with a gap of 0 out of the item, though it dilates nothing', async () => {
            await create(blurred(0));
            const at = rightOfFirstItem();

            expect(isGlowing(at(2))).toBe(true);
            expect(at(40)).toEqual(WHITE);
            expect(isClear(at(-10))).toBe(true);
        });
    });

    describe('validation', () => {
        it('should warn about a negative gap, drop it and cast the glow with no gap', async () => {
            await create(bars({ glow: glow(-4) }));
            const at = rightOfFirstItem();

            expectWarningMessages([expect.stringContaining('glow.gap')]);
            expect(isGlowing(at(3))).toBe(true);
            expect(isClear(at(-10))).toBe(true);
        });

        it('should warn about a negative gap in a highlight bucket and keep the series gap', async () => {
            await create(bars({ glow: glow(5), highlight: { highlightedItem: { glow: { gap: -4 } } } }));
            await hoverFirst();

            expectWarningMessages([expect.stringContaining('glow.gap')]);
            expect(rightOfFirstItem()(2)).toEqual(WHITE);
        });

        it('should accept a gap of 0 without a warning', async () => {
            await create(bars({ glow: glow(0) }));

            expectWarningMessages([]);
        });
    });

    it('should have a gap on a glow only, not on a shadow', () => {
        // @ts-expect-error `gap` is not an option of a drop shadow
        const shadow: AgDropShadowOptions = { enabled: true, gap: 4 };
        expect(shadow).toBeDefined();
    });
});
