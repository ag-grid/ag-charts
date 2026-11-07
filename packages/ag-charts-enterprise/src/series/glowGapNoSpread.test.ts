import { describe, expect, it } from 'vitest';

import {
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { BoxPlotNode } from './box-plot/boxPlotNode';
import { CandlestickNode } from './candlestick/candlestickNode';

const { x: CENTRE_X } = GLOW_CENTRE;
const BLUE = [0, 0, 255];

// A blurred glow with no spread: it reaches past the item by its blur alone, so a missing wick or whisker leaves nothing there.
const blurredGlow = (gap?: number) => ({ ...redGlow(gap), spread: 0, blur: 8 });

type Build = (gap?: number) => Shape;

// A body 30 across from y 80 to 140 with a wick 4 thick above it, and a box with a whisker 4 thick to its left. Each wick is
// a path of its own, and the probes are 3px from its edge, on the side away from the body.
const ITEMS: Record<string, { build: Build; centre: [number, number]; beside: [number, number] }> = {
    'candlestick wick': {
        build: (gap) => {
            const node = new CandlestickNode();
            node.setStaticProperties(CENTRE_X, 30, 40, 140, 80, 140, false, undefined, blurredGlow(gap));
            Object.assign(node, { fill: TRANSLUCENT_BLUE, stroke: TRANSLUCENT_BLUE, strokeWidth: 1 });
            node.setWickProperties('rgba(0, 0, 255, 0.5)', 4, undefined, undefined, undefined);
            return node;
        },
        centre: [CENTRE_X, 60],
        beside: [CENTRE_X + 5, 60],
    },
    'box plot whisker': {
        build: (gap) =>
            Object.assign(new BoxPlotNode(), {
                horizontal: true,
                center: 110,
                thickness: 60,
                min: 40,
                q1: 120,
                median: 200,
                q3: 280,
                max: 360,
                fill: TRANSLUCENT_BLUE,
                stroke: TRANSLUCENT_BLUE,
                strokeWidth: 1,
                wickStroke: 'rgba(0, 0, 255, 0.5)',
                wickStrokeWidth: 4,
                crisp: false,
                fillGlow: blurredGlow(gap),
            }),
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
                ).toEqual(BLUE);
            });
        });
    });
});
