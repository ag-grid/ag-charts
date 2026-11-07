import { describe, expect, it } from 'vitest';

import { Line, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import { Marker } from '../chart/marker/marker';
import {
    BLUE_RGB,
    CLEAR,
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
                expect(pixel.slice(0, 3)).toEqual(BLUE_RGB);
                expect(Math.abs(pixel[3] - 128)).toBeLessThanOrEqual(1);
            });

            it('should start the glow further out with a larger gap', () => {
                const { at } = draw(route, item(5));

                expect(at(inside).slice(0, 3)).toEqual(BLUE_RGB);
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

        describe('with the spread at 0', () => {
            // A blurred glow, which reaches past the item by its blur alone, and a probe 2px left of the item, which is 60 across.
            const blurredGlow = (gap: number | undefined, spread = 0) => ({ ...redGlow(gap), blur: 8, spread });
            const LEFT_EDGE_PROBE: [number, number] = [CENTRE_X - 32, CENTRE_Y];

            // A fill that is transparent at the left of an item and opaque at the right, which an ungapped glow follows.
            const FADING = {
                type: 'gradient' as const,
                gradient: 'linear' as const,
                rotation: 90,
                colorStops: [
                    { color: 'rgba(0, 0, 255, 0)', stop: 0 },
                    { color: 'rgba(0, 0, 255, 1)', stop: 1 },
                ],
            };

            const expectNear = (actual: number[], expected: number[]) => {
                expect(expected[3]).toBeGreaterThan(0);
                expect(Math.abs(actual[3] - expected[3])).toBeLessThanOrEqual(3);
            };

            it('should cut the item out of a glow with a gap of 0 that dilates nothing, and cast it as with no gap', () => {
                const plain = (gap?: number) =>
                    box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, {
                        fill: TRANSLUCENT_BLUE,
                        fillGlow: blurredGlow(gap),
                    });
                const unset = draw(route, plain()).pixelAt(...LEFT_EDGE_PROBE);

                const { pixelAt } = draw(route, plain(0));

                expect(pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
                expectNear(pixelAt(...LEFT_EDGE_PROBE), unset);
            });

            // A gap casts the silhouette of the item, as a spread does, not its real paint, which an ungapped glow with no
            // spread casts. The silhouette of a spread of a hair stands for it.
            it.each([
                ['a gradient fill that fades out at the probe', { fill: FADING }],
                [
                    'a dashed stroke',
                    { fill: undefined, stroke: 'rgba(0, 0, 255, 0.5)', strokeWidth: 6, lineDash: [10, 10] },
                ],
            ])('should cast the glow of %s as a spread does with a gap of 0', (_name, paint) => {
                const alphasLeftOfItem = (glow: ReturnType<typeof blurredGlow>) => {
                    const { pixelAt } = draw(
                        route,
                        box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { ...paint, fillGlow: glow })
                    );
                    return Array.from({ length: 16 }, (_, i) => pixelAt(LEFT_EDGE_PROBE[0], CENTRE_Y - 30 + i * 4)[3]);
                };
                const real = alphasLeftOfItem(blurredGlow(undefined));
                const dilated = alphasLeftOfItem(blurredGlow(undefined, 0.01));

                const gapped = alphasLeftOfItem(blurredGlow(0));

                expect(Math.max(...gapped.map((alpha, i) => Math.abs(alpha - dilated[i])))).toBeLessThanOrEqual(3);
                expect(Math.max(...dilated.map((alpha, i) => alpha - real[i]))).toBeGreaterThan(10);
            });
        });

        it('should keep an unset gap and a gap of 0 apart in one batch, as it keeps their spreads', () => {
            const left = box(60, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow() });
            const right = box(280, CENTRE_Y - 30, 60, 60, { fill: TRANSLUCENT_BLUE, fillGlow: redGlow(0) });
            const { pixelAt } = draw(route, left, right);

            expect(pixelAt(90, CENTRE_Y)[0]).toBeGreaterThan(0);
            expect(pixelAt(310, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
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
            expect(gapped.pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE_RGB);
        });

        it.runIf(route === 'cutout')('should cast the glow of a line inline, with no spread and no gap', () => {
            for (const gap of [undefined, 0, 5]) {
                const { pixelAt } = draw(route, line(gap));
                expect(pixelAt(...up(2))).toEqual(CLEAR);
            }
        });
    });
});
