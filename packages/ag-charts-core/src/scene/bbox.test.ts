import { describe, expect, test } from 'vitest';

import { BBox } from './bbox';

describe('BBox', () => {
    describe('distanceSquared', () => {
        const box = new BBox(10, 10, 100, 50);
        test('contains', () => {
            expect(box.distanceSquared(25, 25)).toBe(0);
        });
        test('NW', () => {
            expect(box.distanceSquared(7, 6)).toBe(25);
        });
        test('N', () => {
            expect(box.distanceSquared(40, 3)).toBe(49);
        });
        test('NE', () => {
            expect(box.distanceSquared(114, 5)).toBe(41);
        });
        test('E', () => {
            expect(box.distanceSquared(120, 50)).toBe(100);
        });
        test('SE', () => {
            expect(box.distanceSquared(113, 65)).toBe(34);
        });
        test('S', () => {
            expect(box.distanceSquared(61, 68)).toBe(64);
        });
        test('SW', () => {
            expect(box.distanceSquared(7, 63)).toBe(18);
        });
        test('W', () => {
            expect(box.distanceSquared(1, 35)).toBe(81);
        });
    });

    describe('nearestSquared', () => {
        const boxes = [
            new BBox(0, 0, 2, 4),
            new BBox(5000, 5000, 1, 1),
            new BBox(Infinity, Infinity, Infinity, Infinity),
            new BBox(1, 1, 3, 3),
            new BBox(1, 6, 5, 5),
        ];

        test('should find nearest box', () => {
            expect(BBox.nearestBox(0, 0, boxes).nearest).toBe(boxes[0]);
            expect(BBox.nearestBox(6000, 6000, boxes).nearest).toBe(boxes[1]);
            expect(BBox.nearestBox(7, 0, boxes).nearest).toBe(boxes[3]);
            expect(BBox.nearestBox(0, 20, boxes).nearest).toBe(boxes[4]);
        });
    });

    describe('clip', () => {
        test('should reduce the box to its intersection with the clip bounds', () => {
            const box = new BBox(0, 0, 10, 10);

            expect(box.clip({ x: 5, y: 5, width: 10, height: 10 })).toBe(box);
            expect(box.x).toBe(5);
            expect(box.y).toBe(5);
            expect(box.width).toBe(5);
            expect(box.height).toBe(5);
        });

        test('should leave the box untouched when the clip bounds are undefined', () => {
            const box = new BBox(3, 4, 10, 20);

            box.clip(undefined);

            expect(box.x).toBe(3);
            expect(box.y).toBe(4);
            expect(box.width).toBe(10);
            expect(box.height).toBe(20);
        });

        test('should give a negative width and height for disjoint bounds', () => {
            // There is deliberately no zero-clamp: a disjoint result reports a negative extent.
            const box = new BBox(0, 0, 10, 10);

            box.clip({ x: 50, y: 50, width: 10, height: 10 });

            expect(box.x).toBe(50);
            expect(box.y).toBe(50);
            expect(box.width).toBe(-40);
            expect(box.height).toBe(-40);
        });
    });
});
