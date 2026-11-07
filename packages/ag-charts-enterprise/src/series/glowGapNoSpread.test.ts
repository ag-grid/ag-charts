import { describe, expect, it } from 'vitest';

import {
    BLUE_RGB,
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { boxPlot, candlestick } from '../test/glowGapItems';

const { x: CENTRE_X } = GLOW_CENTRE;

// A blurred glow with no spread: it reaches past the item by its blur alone, so a missing wick or whisker leaves nothing there.
const blurredGlow = (gap?: number) => ({ ...redGlow(gap), spread: 0, blur: 8 });

type Build = (gap?: number) => Shape;

// A candlestick and a box plot, whose wicks and whiskers are 4 thick, and the probes are 3px from their edge, on the side away
// from the body.
const ITEMS: Record<string, { build: Build; centre: [number, number]; beside: [number, number] }> = {
    'candlestick wick': {
        build: (gap) => candlestick(blurredGlow(gap), CENTRE_X),
        centre: [CENTRE_X, 60],
        beside: [CENTRE_X + 5, 60],
    },
    'box plot whisker': {
        build: (gap) => boxPlot(blurredGlow(gap)),
        centre: [80, 110],
        beside: [80, 105],
    },
};

describe('glow gap with no spread, around the extras of an item', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe.each(Object.entries(ITEMS))('around a %s', (_name, { build, centre, beside }) => {
            it.each([0, 5])('should cast what the glow casts outside the gap, with a gap of %d', (gap) => {
                const ungapped = draw(route, build()).pixelAt(...beside);
                const gapped = draw(route, build(gap)).pixelAt(...beside);

                // 5px from the wick's centre, 3px from its edge, the gap clears nothing at 0 and the glow is the same.
                expect(ungapped[3]).toBeGreaterThan(0);
                if (gap === 0) {
                    expect(Math.abs(gapped[3] - ungapped[3])).toBeLessThanOrEqual(3);
                } else {
                    expect(gapped[3]).toBe(0);
                }
            });

            it('should cut the extras out of the glow with a gap of 0', () => {
                expect(
                    draw(route, build(0))
                        .pixelAt(...centre)
                        .slice(0, 3)
                ).toEqual(BLUE_RGB);
            });
        });
    });
});
