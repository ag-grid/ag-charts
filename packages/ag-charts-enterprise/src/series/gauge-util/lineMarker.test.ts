import { describe, expect, it } from 'vitest';

import { LineMarker, lineMarker } from './lineMarker';

describe('LineMarker', () => {
    function createLineTarget() {
        const marker = new LineMarker();
        marker.shape = lineMarker;
        marker.size = 40; // segment runs vertically from y-20 to y+20 in local space
        marker.strokeWidth = 2; // hit-test tolerance band of 1px each side
        marker.translationX = 100;
        marker.translationY = 100;
        return marker;
    }

    describe('distanceSquared', () => {
        it('reads as a hit anywhere along the rendered line', () => {
            const marker = createLineTarget();
            expect(marker.distanceSquared(100, 100)).toBe(0); // centre
            expect(marker.distanceSquared(100, 115)).toBe(0); // along the segment
            expect(marker.distanceSquared(100, 80)).toBe(0); // segment end
        });

        it('does not read as a hit in empty space beside the line', () => {
            const marker = createLineTarget();
            // Perpendicular to the line, well within the old circular (radius = size/2) hit zone.
            expect(marker.distanceSquared(110, 100)).toBeGreaterThan(0);
            // Beyond the segment ends.
            expect(marker.distanceSquared(100, 130)).toBeGreaterThan(0);
        });

        it('measures distance from the translated position, not the untransformed origin', () => {
            const marker = createLineTarget();
            expect(marker.distanceSquared(0, 0)).toBeGreaterThan(0);
        });

        it('falls back to the circular hit-test for non-line target shapes', () => {
            const marker = createLineTarget();
            marker.shape = 'square';
            expect(marker.distanceSquared(100, 100)).toBe(0);
            expect(marker.distanceSquared(115, 100)).toBe(0); // within radius = size/2
        });
    });
});
