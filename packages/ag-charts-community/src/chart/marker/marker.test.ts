import { describe, expect, it } from 'vitest';

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
});
