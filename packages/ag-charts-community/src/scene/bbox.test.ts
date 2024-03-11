import { describe, expect, test } from '@jest/globals';

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
        expect(BBox.nearestBox(0, 0, boxes).nearest).toBe(boxes[0]);
        expect(BBox.nearestBox(6000, 6000, boxes).nearest).toBe(boxes[1]);
        expect(BBox.nearestBox(7, 0, boxes).nearest).toBe(boxes[3]);
        expect(BBox.nearestBox(0, 20, boxes).nearest).toBe(boxes[4]);
    });
});
