import { describe, expect, test } from '@jest/globals';

import { BBox } from './bbox';

describe('distanceSquared', () => {
    const box = new BBox(10, 10, 100, 50);
    test('contains', () => {
        expect(box.distanceSquared({ x: 25, y: 25 })).toBe(0);
    });
    test('NW', () => {
        expect(box.distanceSquared({ x: 7, y: 6 })).toBe(25);
    });
    test('N', () => {
        expect(box.distanceSquared({ x: 40, y: 3 })).toBe(49);
    });
    test('NE', () => {
        expect(box.distanceSquared({ x: 114, y: 5 })).toBe(41);
    });
    test('E', () => {
        expect(box.distanceSquared({ x: 120, y: 50 })).toBe(100);
    });
    test('SE', () => {
        expect(box.distanceSquared({ x: 113, y: 65 })).toBe(34);
    });
    test('S', () => {
        expect(box.distanceSquared({ x: 61, y: 68 })).toBe(64);
    });
    test('SW', () => {
        expect(box.distanceSquared({ x: 7, y: 63 })).toBe(18);
    });
    test('W', () => {
        expect(box.distanceSquared({ x: 1, y: 35 })).toBe(81);
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
    expect(BBox.nearestBox({ x: 0, y: 0 }, boxes).nearest).toBe(boxes[0]);
    expect(BBox.nearestBox({ x: 6000, y: 6000 }, boxes).nearest).toBe(boxes[1]);
    expect(BBox.nearestBox({ x: 7, y: 0 }, boxes).nearest).toBe(boxes[3]);
    expect(BBox.nearestBox({ x: 0, y: 20 }, boxes).nearest).toBe(boxes[4]);
});
