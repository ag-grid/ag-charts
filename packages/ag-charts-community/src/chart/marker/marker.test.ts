import { describe, expect, it } from 'vitest';

import { MARKER_SHAPES, getSharedMarkerPath } from 'ag-charts-core';
import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { Marker } from './marker';

describe('Marker', () => {
    describe('distanceSquared', () => {
        it('measures distance from the translated position, not the untransformed origin', () => {
            const marker = new Marker();
            marker.shape = 'square';
            marker.size = 20;
            marker.translationX = 100;
            marker.translationY = 100;

            // Pointer over the marker's rendered centre (its translation) reads as a hit.
            expect(marker.distanceSquared(100, 100)).toBe(0);

            // Pointer near the scene origin — far from the rendered marker — must not read as a hit.
            expect(marker.distanceSquared(0, 0)).toBeGreaterThan(0);
        });
    });

    describe('pickInflation (AG-8173 — the drawn stroke is part of the node)', () => {
        const makeMarker = (pickInflation: number) => {
            const marker = new Marker();
            marker.shape = 'circle';
            marker.size = 20;
            marker.x = 0;
            marker.y = 0;
            marker.pickInflation = pickInflation;
            return marker;
        };

        it('defaults to no inflation, so an unstroked node keeps exactly its size/2 hit region', () => {
            const marker = makeMarker(0);

            expect(marker.pickInflation).toBe(0);
            expect(marker.isPointInPath(10, 0)).toBe(true);
            expect(marker.isPointInPath(10.5, 0)).toBe(false);
            expect(marker.isPointInPath(12, 0)).toBe(false);
        });

        it('accepts a point inside the stroke band and still rejects one beyond it', () => {
            // A 10px stroke straddles the path, so the drawn outer radius is 10 + 5 = 15.
            const marker = makeMarker(5);

            expect(marker.isPointInPath(12, 0)).toBe(true);
            expect(marker.isPointInPath(15, 0)).toBe(true);
            expect(marker.isPointInPath(15.5, 0)).toBe(false);
            // Diagonally too — the region is a disc, not a box.
            expect(marker.isPointInPath(10, 10)).toBe(true);
            expect(marker.isPointInPath(11, 11)).toBe(false);
        });

        it('leaves distanceSquared — the nearest/numeric range metric — unchanged', () => {
            const plain = makeMarker(0);
            const inflated = makeMarker(5);

            for (const [x, y] of [
                [0, 0],
                [12, 0],
                [40, 30],
            ]) {
                expect(inflated.distanceSquared(x, y)).toBe(plain.distanceSquared(x, y));
            }
        });

        it('respects non-centred anchors', () => {
            // 'pin' is anchored at {x: 0.5, y: 1}, so its disc centre sits size/2 above `y`.
            const pin = new Marker();
            pin.shape = 'pin';
            pin.size = 20;
            pin.x = 0;
            pin.y = 0;
            pin.pickInflation = 5;

            expect(pin.isPointInPath(0, -10)).toBe(true);
            expect(pin.isPointInPath(0, -22)).toBe(true);
            expect(pin.isPointInPath(0, -26)).toBe(false);
        });
    });

    describe('getShadowSilhouetteBounds', () => {
        const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        const SIZE = 10;
        // Curved shapes (heart) round a hair past their box; far below a device pixel.
        const EPSILON = 1e-3;

        const measure = (shape: AgMarkerShape) => {
            const marker = new Marker({ shape });
            marker.size = SIZE;
            const out = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
            const bounded = marker.getShadowSilhouetteBounds(IDENTITY, 0, out);
            return { bounded, out };
        };

        it('bounds every built-in shape by all that it draws', () => {
            for (const shape of Object.keys(MARKER_SHAPES) as Array<keyof typeof MARKER_SHAPES>) {
                const { bounded, out } = measure(shape);
                const anchor = Marker.anchor(shape);
                const drawn = getSharedMarkerPath(shape, SIZE).computeBBox();
                const left = drawn.x - (anchor.x - 0.5) * SIZE;
                const top = drawn.y - (anchor.y - 0.5) * SIZE;

                expect(bounded, shape).toBe(true);
                expect(out.minX, shape).toBeLessThanOrEqual(left + EPSILON);
                expect(out.minY, shape).toBeLessThanOrEqual(top + EPSILON);
                expect(out.maxX, shape).toBeGreaterThanOrEqual(left + drawn.width - EPSILON);
                expect(out.maxY, shape).toBeGreaterThanOrEqual(top + drawn.height - EPSILON);
            }
        });

        it('pads a square, which snaps to device pixels, by a device pixel', () => {
            expect(measure('square').out).toEqual({ minX: -6, minY: -6, maxX: 6, maxY: 6 });
            expect(measure('circle').out).toEqual({ minX: -5, minY: -5, maxX: 5, maxY: 5 });
        });

        it('leaves a custom shape unbounded, as its path can pass its size', () => {
            const custom: AgMarkerShapeFn = ({ path, x, y, size }) => {
                path.moveTo(x, y);
                path.lineTo(x + size * 3, y + size * 3);
            };

            expect(measure(custom).bounded).toBe(false);
        });
    });
});
