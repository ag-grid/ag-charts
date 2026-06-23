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
});
