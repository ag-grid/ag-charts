import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { visibleItems } from '../../test/glowRender';
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

/** Whether the pixel is reddened: a glow is cast on it. */
const isGlowing = (pixel: number[]) => pixel[0] === 255 && pixel[1] < 255;
/** Whether the item is over white, as a glow that is cut out of the footprint of the item leaves it. */
const isClear = (pixel: number[]) => Math.abs(pixel[1] - LAVENDER_GREEN) <= 2 && pixel[2] === 255;

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

    const bars = (options: object): AgCartesianChartOptions => ({
        data: [{ category: 'A', value: 8 }],
        series: [{ type: 'bar', xKey: 'category', yKey: 'value', ...TRANSLUCENT_ITEM, ...options }],
    });

    const markers = (options: object): AgCartesianChartOptions => ({
        data: [{ x: 5, y: 5 }],
        series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 40, shape: 'square', ...TRANSLUCENT_ITEM, ...options }],
    });

    // The glow is cast by the series on every item, or by the highlight copy of the hovered one, which is drawn the same.
    describe.each([
        { name: 'bar', build: (gap?: number) => bars({ glow: glow(gap) }), hovered: false },
        { name: 'scatter marker', build: (gap?: number) => markers({ glow: glow(gap) }), hovered: false },
        {
            name: 'bar, hovered and cast by its highlight copy',
            build: (gap?: number) => bars({ highlight: { highlightedItem: { glow: glow(gap) } } }),
            hovered: true,
        },
    ])('around a $name', ({ build, hovered }) => {
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

        // With no gap set, the glow takes the theme's gap of 1, which cuts the item's footprint out of the glow in the highlight
        // copy, as in the overlay that the series casts its glow in, so a translucent item does not show it through.
        it('should cast a glow with the theme gap, and keep it out of the translucent item', async () => {
            const at = await createAndHover();

            expect(isGlowing(at(3))).toBe(true);
            expect(at(3)).toEqual(GLOW_RED);
            expect(at(8)).toEqual(GLOW_RED);
            expect(isClear(at(-10))).toBe(true);
        });

        it('should keep the glow out of the item with a gap of 0, and cast it as far out as with no gap', async () => {
            const at = await createAndHover(0);

            expect(isClear(at(-10))).toBe(true);
            expect(at(3)).toEqual(GLOW_RED);
            expect(at(8)).toEqual(GLOW_RED);
            expect(at(15)).toEqual(WHITE);
        });

        it('should start the glow a gap past the item and end it a spread further out', async () => {
            const at = await createAndHover(5);

            expect(isClear(at(-10))).toBe(true);
            expect(at(2)).toEqual(WHITE);
            expect(isGlowing(at(8))).toBe(true);
            expect(isGlowing(at(13))).toBe(true);
            expect(at(18)).toEqual(WHITE);
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

    describe('around a marker with a wide stroke', () => {
        const GAP = 1;
        const SPREAD = 8;
        const strokedMarkers = (stroke: object) =>
            markers({
                fill: 'blue',
                fillOpacity: 1,
                stroke: 'darkslategray',
                glow: { blur: 0, spread: SPREAD, fill: 'red', fillOpacity: 1 },
                ...stroke,
            });

        it.each([
            { strokeWidth: 6 },
            { strokeWidth: 12 },
            { strokeWidth: 18 },
            { strokeWidth: 24 },
            { strokeWidth: 24, strokeOpacity: 0 },
        ])('should grow the glow a gap and a spread past the outer edge of a stroke of $strokeWidth', async (stroke) => {
            await create(strokedMarkers(stroke));
            const at = rightOfFirstItem();
            const outerEdge = stroke.strokeWidth / 2;

            expect(at(outerEdge + GAP + 1)).toEqual(GLOW_RED);
            expect(at(outerEdge + GAP + SPREAD - 2)).toEqual(GLOW_RED);
            expect(at(outerEdge + GAP + SPREAD + 2)).toEqual(WHITE);
        });

        it('should keep the default hover glow visible past a stroke of 6', async () => {
            const strokeWidth = 6;
            await create(
                markers({
                    stroke: 'darkslategray',
                    strokeWidth,
                    highlight: { highlightedItem: { glow: { fill: 'red' } } },
                })
            );
            await hoverFirst();
            const pixel = rightOfFirstItem()(strokeWidth / 2 + GAP + 1);

            expect(pixel[0]).toBe(255);
            expect(pixel[1]).toBeLessThanOrEqual(160);
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
