import { describe, expect, it } from 'vitest';

import { Line, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import { Marker } from '../chart/marker/marker';
import {
    GLOW_CENTRE,
    GLOW_PROBES,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    useGlowScenes,
} from '../chart/test/glowGapFixtures';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { box } from '../util/test/shadowPixels';

type Build = (mixin: Partial<Shape>) => Shape;

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;
const { inside, near, middle, outer, past } = GLOW_PROBES;
const CLEAR = [0, 0, 0, 0];

// Each shape is 60 across the line through its centre.
const SHAPES: Record<string, Build> = {
    rect: (mixin) => box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, mixin),
    sector: (mixin) =>
        Object.assign(new Sector(), {
            centerX: CENTRE_X,
            centerY: CENTRE_Y,
            innerRadius: 0,
            outerRadius: 30,
            startAngle: 0,
            endAngle: 2 * Math.PI,
            stroke: undefined,
            strokeWidth: 0,
            ...mixin,
        }),
    marker: (mixin) => {
        const marker = Object.assign(new Marker(), { stroke: undefined, strokeWidth: 0, ...mixin });
        marker.setVisibilityAndPosition(true, 'square', 60, { x: CENTRE_X, y: CENTRE_Y });
        return marker;
    },
};

describe('glow gap', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe.each(Object.entries(SHAPES))('around a %s', (_name, build) => {
            const item = (gap?: number, mixin: Partial<Shape> = {}) =>
                build({ fill: TRANSLUCENT_BLUE, fillGlow: redGlow(gap), ...mixin });

            it('should cast the glow like a shadow, and show it through a translucent item, with no gap', () => {
                const { at } = draw(route, item());

                expect(at(near)[3]).toBeGreaterThan(0);
                expect(at(middle)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
                // The red of the glow is beneath the blue of the item.
                expect(at(inside)[0]).toBeGreaterThan(0);
            });

            it('should cut the footprint of the item out of the glow with a gap of 0', () => {
                const unset = draw(route, item());
                const [nearUnset, middleUnset] = [unset.at(near), unset.at(middle)];
                const { at } = draw(route, item(0));

                // The glow is the same around the item, and none of it shows through the item.
                expect(at(near)).toEqual(nearUnset);
                expect(at(middle)).toEqual(middleUnset);
                expect(at(past)).toEqual(CLEAR);
                const pixel = at(inside);
                expect(pixel.slice(0, 3)).toEqual([0, 0, 255]);
                expect(Math.abs(pixel[3] - 128)).toBeLessThanOrEqual(1);
            });

            it('should start the glow further out with a larger gap', () => {
                const { at } = draw(route, item(5));

                expect(at(inside).slice(0, 3)).toEqual([0, 0, 255]);
                expect(at(near)).toEqual(CLEAR);
                expect(at(middle)[3]).toBeGreaterThan(0);
                // The glow ends a spread past where it starts, which is the gap and the spread past the item.
                expect(at(outer)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
            });

            it('should clear the whole footprint of an item with no fill, which its stroke glows around', () => {
                const { at } = draw(route, item(0, { fill: undefined, stroke: TRANSLUCENT_BLUE, strokeWidth: 4 }));

                expect(at(near + 2)[3]).toBeGreaterThan(0);
                expect(at(past)).toEqual(CLEAR);
                // The glow of the stroke reaches 6px inside the edge, where the item has no fill to cover it.
                expect(at(-6)).toEqual(CLEAR);
            });
        });

        it('should keep an unset gap and a gap of 0 apart in one batch, as it keeps their spreads', () => {
            const left = box(60, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow() });
            const right = box(280, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow(0) });
            const { pixelAt } = draw(route, left, right);

            expect(pixelAt(90, CENTRE_Y)[0]).toBeGreaterThan(0);
            expect(pixelAt(310, CENTRE_Y).slice(0, 3)).toEqual([0, 0, 255]);
        });

        it.each([Number.NaN, Number.POSITIVE_INFINITY])('should cast no glow with a gap of %s', (gap) => {
            const { at } = draw(route, SHAPES.rect({ fill: TRANSLUCENT_BLUE, fillGlow: redGlow(gap) }));

            expect(at(near)).toEqual(CLEAR);
            expect(at(middle)).toEqual(CLEAR);
        });

        // A Line has no Path2D to dilate, so a cutout casts its glow inline with its stroke, as it casts one with a spread
        // and no gap: it reaches no further than its own stroke, and the gap changes nothing. A batch dilates its stroke.
        const line = (gap?: number) =>
            Object.assign(new Line(), {
                x1: 120,
                y1: CENTRE_Y,
                x2: 280,
                y2: CENTRE_Y,
                stroke: TRANSLUCENT_BLUE,
                strokeWidth: 6,
                fillGlow: redGlow(gap),
            });
        // Pixels above the line: 3px up is its edge, so the glow starts a gap past it.
        const up = (distance: number) => [CENTRE_X, CENTRE_Y - 3 - distance] as const;

        it.skipIf(route === 'cutout')('should widen the stroke of a line by the gap and the spread', () => {
            const unset = draw(route, line());
            expect(unset.pixelAt(...up(2))[3]).toBeGreaterThan(0);
            expect(unset.pixelAt(CENTRE_X, CENTRE_Y)[0]).toBeGreaterThan(0);

            const gapped = draw(route, line(5));
            expect(gapped.pixelAt(...up(2))).toEqual(CLEAR);
            expect(gapped.pixelAt(...up(7))[3]).toBeGreaterThan(0);
            expect(gapped.pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual([0, 0, 255]);
        });

        it.runIf(route === 'cutout')('should cast the glow of a line inline, with no spread and no gap', () => {
            for (const gap of [undefined, 0, 5]) {
                const { pixelAt } = draw(route, line(gap));
                expect(pixelAt(...up(2))).toEqual(CLEAR);
            }
        });
    });
});
