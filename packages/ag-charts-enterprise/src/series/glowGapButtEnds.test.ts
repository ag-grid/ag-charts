import { describe, expect, it } from 'vitest';

import {
    CLEAR,
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { boxPlot, candlestick } from '../test/glowGapItems';

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;

/**
 * A wick or a whisker has butt caps, so a glow's gap is the gap past its end: the cut ends `gap` past it, however thick the wick
 * is. The ends of the items below are probed in the line that the wick runs along, past the end, one pixel at a time.
 */
interface End {
    build: (gap?: number) => Shape;
    /** Whether the wick runs along the y axis, and the other coordinate of the line along it. */
    vertical: boolean;
    across: number;
    /** The coordinate of the end of the wick, and which way is past it: -1 for towards 0, 1 for away from it. */
    end: number;
    direction: -1 | 1;
}

// A wick 4 thick, which is a path of its own, and one that is in the path of the body, which has a stroke of 4.
const WICK_PATHS = {
    'in a path of its own': {},
    'in the path of the body': { strokeWidth: 4 },
};

const candlestickEnds = (widths: object): Record<string, End> => ({
    'the top end of a candlestick wick': {
        build: (gap) => candlestick(redGlow(gap), CENTRE_X, widths),
        vertical: true,
        across: CENTRE_X,
        end: 40,
        direction: -1,
    },
    'the bottom end of a candlestick wick': {
        build: (gap) => candlestick(redGlow(gap), CENTRE_X, widths),
        vertical: true,
        across: CENTRE_X,
        end: 180,
        direction: 1,
    },
});

// The caps of the whiskers are 60 across, centred on the whiskers, and 4 thick.
const boxPlotEnds = (widths: object): Record<string, End> => ({
    'the top end of the cap of a box plot whisker': {
        build: (gap) => boxPlot(redGlow(gap), widths),
        vertical: true,
        across: 40,
        end: 80,
        direction: -1,
    },
    'the bottom end of the cap of a box plot whisker': {
        build: (gap) => boxPlot(redGlow(gap), widths),
        vertical: true,
        across: 40,
        end: 140,
        direction: 1,
    },
    // With no cap the whisker itself ends, 40 from the centre of the plot.
    'the end of a box plot whisker with no cap': {
        build: (gap) => Object.assign(boxPlot(redGlow(gap), widths), { capLengthRatio: 0 }),
        vertical: false,
        across: CENTRE_Y,
        end: 40,
        direction: -1,
    },
});

describe('glow gap past the butt ends of wicks and whiskers', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe.each(Object.entries(WICK_PATHS))('with the wicks %s', (_paths, widths) => {
            const ENDS = { ...candlestickEnds(widths), ...boxPlotEnds(widths) };

            describe.each(Object.entries(ENDS))('at %s', (_name, { build, vertical, across, end, direction }) => {
                /** The pixel `distance` pixels past the end of the wick, so that 0 is the pixel that touches it. */
                const pastEnd = (pixelAt: (x: number, y: number) => number[], distance: number) => {
                    const along = direction < 0 ? end - 1 - distance : end + distance;
                    return vertical ? pixelAt(across, along) : pixelAt(along, across);
                };

                it.each([0, 2, 5, 8])('should clear exactly the gap past the end with a gap of %d', (gap) => {
                    const { pixelAt } = draw(route, build(gap));

                    for (let distance = 0; distance < gap; distance++) {
                        expect(pastEnd(pixelAt, distance), `${distance}px past the end`).toEqual(CLEAR);
                    }
                    // The glow starts at the gap, and is there in the 3px beyond it, which a cut of a half-stroke more would clear.
                    for (const distance of [gap, gap + 1, gap + 3]) {
                        expect(pastEnd(pixelAt, distance)[3], `${distance}px past the end`).toBeGreaterThan(0);
                    }
                });

                it('should end the glow of a wick no more than a stroke and a spread past the end', () => {
                    const { pixelAt } = draw(route, build(5));

                    // The gap is 5 and the spread is 10; the spread of a wick is dilated by a square cap, 2px more.
                    expect(pastEnd(pixelAt, 5 + 7)[3]).toBeGreaterThan(0);
                    expect(pastEnd(pixelAt, 5 + 10 + 4)).toEqual(CLEAR);
                });

                it('should cast the glow of a wick past the end as it did, with no gap', () => {
                    const { pixelAt } = draw(route, build());

                    // The glow is cut nowhere past the end, apart from the footprint that a root cuts out of every glow, which
                    // covers the end by 2px at most.
                    if (route !== 'root') expect(pastEnd(pixelAt, 0)[3]).toBeGreaterThan(0);
                    for (const distance of [3, 6, 9]) {
                        expect(pastEnd(pixelAt, distance)[3], `${distance}px past the end`).toBeGreaterThan(0);
                    }
                });
            });
        });
    });
});
