import { afterEach, describe, expect, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import { getSeriesNodeData, getSeriesSelectionNodes } from '../../test/seriesAccessors';
import {
    type Chart,
    createChart,
    deproxy,
    expectWarningMessages,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A glow with a spread of 10 and no blur, so that a pixel is in it or out of it: it starts a `gap` past the edge of an item
// and ends 10px further out.
const glow = (gap?: number) => ({ blur: 0, spread: 10, fill: 'red', fillOpacity: 1, gap });

// The item is half-opaque blue on a white chart, and a glow is cast at the strength of its item, so it is pink beside it. Where
// the glow is beneath the item, the item is purple over it, with less green than the lavender of the item over white.
const WHITE = [255, 255, 255, 255];
const TRANSLUCENT_ITEM = { fill: 'blue', fillOpacity: 0.5, strokeWidth: 0 };
const LAVENDER_GREEN = 128;

/** Whether the pixel is pink: a glow is cast on it. */
const isGlowing = (pixel: number[]) => pixel[0] === 255 && pixel[1] < 255;
/** Whether the item is over a glow, which makes it darker than over white, as a translucent item shows a glow through it. */
const showsGlow = (pixel: number[]) => pixel[1] < LAVENDER_GREEN - 30;
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

    const pixelAt = (x: number, y: number) => [
        ...chart!.ctx.scene.canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
    ];

    /** The pixel `distance` to the right of the first item, along the line across its middle, which is inside it if negative. */
    const rightOfFirstItem = () => {
        const [node] = getSeriesSelectionNodes<Node>(chart!, 'datumSelection').filter((n) => n.visible);
        const { x, y, width, height } = Transformable.toCanvas(node);
        return (distance: number) => pixelAt(x + width + distance, y + height / 2);
    };

    const hoverFirst = async () => {
        const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart!);
        chart!.ctx.highlightManager.updateHighlight(chart!.id, datum);
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

        it('should show a glow with no gap through the translucent item, like a shadow', async () => {
            const at = await createAndHover();

            expect(isGlowing(at(3))).toBe(true);
            expect(showsGlow(at(-10))).toBe(true);
        });

        it('should keep the glow out of the item with a gap of 0, and cast it as far out as with no gap', async () => {
            const unset = await createAndHover();
            const [near, far] = [unset(3), unset(8)];

            const at = await createAndHover(0);

            expect(isClear(at(-10))).toBe(true);
            expect(at(3)).toEqual(near);
            expect(at(8)).toEqual(far);
            expect(isGlowing(at(8))).toBe(true);
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
        it('should let a highlight gap of 0 clear a series gap, and inherit it where the bucket sets none', async () => {
            await create(bars({ glow: glow(5), highlight: { highlightedItem: { glow: { gap: 0 } } } }));
            await hoverFirst();
            expect(isGlowing(rightOfFirstItem()(2))).toBe(true);

            await create(bars({ glow: glow(5), highlight: { highlightedItem: { glow: { blur: 0 } } } }));
            await hoverFirst();
            expect(rightOfFirstItem()(2)).toEqual(WHITE);
        });
    });

    describe('with the spread at 0', () => {
        // The blur of the glow reaches 12px past the item, so a probe 40px out is clear of it.
        const blurred = (gap?: number) => bars({ glow: { blur: 8, spread: 0, fill: 'red', fillOpacity: 1, gap } });

        it('should show a glow with no gap through the item', async () => {
            await create(blurred());
            const at = rightOfFirstItem();

            expect(isGlowing(at(2))).toBe(true);
            expect(at(40)).toEqual(WHITE);
            expect(showsGlow(at(-10))).toBe(true);
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
        it('should warn about a negative gap, drop it and cast the glow like a shadow', async () => {
            await create(bars({ glow: glow(-4) }));
            const at = rightOfFirstItem();

            expectWarningMessages([expect.stringContaining('glow.gap')]);
            expect(showsGlow(at(-10))).toBe(true);
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
