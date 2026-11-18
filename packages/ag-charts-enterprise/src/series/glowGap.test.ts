import { describe, expect, it } from 'vitest';

import {
    BLUE_RGB,
    CLEAR,
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { boxPlot, candlestick, sankeyLink } from '../test/glowGapItems';

type Point = readonly [number, number];

interface Probes {
    /** Points in the footprint of the item, where its body, link or wick is. */
    inside: Point[];
    /** A point in the glow just outside the footprint, which a gap of 5 clears and a gap of 0 doesn't. */
    near: Point;
    /** A point in the 5px past the footprint, which a gap of 5 leaves clear. */
    band: Point;
    /** A point in the glow of a gap of 5, and one past where it ends. */
    far: Point;
    past: Point;
}

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;

// A glow with a spread of 10 and no blur: a pixel is in it or out of it. A wick ends 2px from its centre, so a gap of 5
// starts the glow at 7 and ends it at 17.
const ITEMS: Record<string, { build: (gap?: number) => Shape; probes: Probes }> = {
    'sankey link': {
        build: (gap) => sankeyLink(redGlow(gap)),
        probes: {
            inside: [[CENTRE_X, CENTRE_Y]],
            near: [CENTRE_X, 85],
            band: [CENTRE_X, 87],
            far: [CENTRE_X, 80],
            past: [CENTRE_X, 70],
        },
    },
    'candlestick wick': {
        build: (gap) => candlestick(redGlow(gap), CENTRE_X),
        probes: {
            inside: [
                [CENTRE_X, 60],
                [CENTRE_X, CENTRE_Y],
            ],
            near: [CENTRE_X + 7, 60],
            band: [CENTRE_X + 4, 60],
            far: [CENTRE_X + 12, 60],
            past: [CENTRE_X + 20, 60],
        },
    },
    'box plot whisker': {
        build: (gap) => boxPlot(redGlow(gap)),
        probes: {
            inside: [
                [80, CENTRE_Y],
                [200, CENTRE_Y - 10],
            ],
            near: [80, CENTRE_Y - 6],
            band: [80, CENTRE_Y - 4],
            far: [80, CENTRE_Y - 12],
            past: [80, CENTRE_Y - 20],
        },
    },
};

describe('glow gap of items that are not a simple path', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe.each(Object.entries(ITEMS))('around a %s', (_name, { build, probes }) => {
            // The root casts the glows in an overlay, which cuts the footprint of every item that glows out of them.
            it('should show the glow through the item with no gap, unless the root casts it in an overlay', () => {
                const { pixelAt } = draw(route, build());

                for (const point of probes.inside) {
                    if (route === 'root') expect(pixelAt(...point)[0]).toBe(0);
                    else expect(pixelAt(...point)[0]).toBeGreaterThan(0);
                }
                expect(pixelAt(...probes.near)[3]).toBeGreaterThan(0);
            });

            it('should cut the item out of the glow with a gap of 0', () => {
                const { pixelAt } = draw(route, build(0));

                for (const point of probes.inside) expect(pixelAt(...point).slice(0, 3)).toEqual(BLUE_RGB);
                expect(pixelAt(...probes.near)[3]).toBeGreaterThan(0);
            });

            it('should start the glow a gap past the item with a larger gap', () => {
                const { pixelAt } = draw(route, build(5));

                for (const point of probes.inside) expect(pixelAt(...point).slice(0, 3)).toEqual(BLUE_RGB);
                expect(pixelAt(...probes.band)).toEqual(CLEAR);
                expect(pixelAt(...probes.far)[3]).toBeGreaterThan(0);
                expect(pixelAt(...probes.past)).toEqual(CLEAR);
            });
        });
    });
});
