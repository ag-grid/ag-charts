import { describe, expect, it } from 'vitest';

import type { AnnotationContext } from '../annotationTypes';
import { magnetTranslation } from './coords';
import { applyMagnet, nearestMagnetPoint, resolveMagnetMode } from './magnet';

describe('resolveMagnetMode', () => {
    it.each([
        { enabled: false, invert: false, expected: undefined },
        { enabled: true, invert: false, expected: 'strong' },
        { enabled: false, invert: true, expected: 'strong' },
        { enabled: true, invert: true, expected: undefined },
    ])('enabled $enabled with invert $invert is $expected', ({ enabled, invert, expected }) => {
        expect(resolveMagnetMode(enabled, 'strong', invert)).toBe(expected);
    });
});

describe('nearestMagnetPoint', () => {
    const candidates = [
        { x: 100, y: 10 },
        { x: 100, y: 40 },
        { x: 100, y: 90 },
    ];

    it.each([
        { mode: 'weak', point: { x: 100, y: 41 }, range: 20, expected: candidates[1] },
        { mode: 'weak', point: { x: 100, y: 60 }, range: 20, expected: candidates[1] },
        { mode: 'weak', point: { x: 100, y: 61 }, range: 20, expected: undefined },
        { mode: 'weak', point: { x: 112, y: 40 }, range: 20, expected: candidates[1] },
        { mode: 'weak', point: { x: 116, y: 53 }, range: 20, expected: undefined },
        { mode: 'strong', point: { x: 100, y: 60 }, range: 1, expected: candidates[1] },
        { mode: 'strong', point: { x: 400, y: 500 }, range: 1, expected: candidates[2] },
    ] as const)('$mode at $point within $range is $expected', ({ mode, point, range, expected }) => {
        expect(nearestMagnetPoint(point, candidates, mode, range)).toEqual(expected);
    });

    it('has nothing to snap to without candidates', () => {
        expect(nearestMagnetPoint({ x: 5, y: 5 }, [], 'strong', 20)).toBeUndefined();
    });
});

describe('applyMagnet', () => {
    // The open, high, low and close of a candlestick at x = 100, in the series area.
    const candlestick = [20, 50, 120, 80].map((y) => ({ x: 100, y }));

    it('snaps both the horizontal and the vertical position', () => {
        expect(applyMagnet({ x: 93, y: 82 }, candlestick, 'weak', 20)).toEqual({ x: 100, y: 80 });
    });

    it('leaves the point alone when there is no mode or it is out of range', () => {
        const offset = { x: 93, y: 82 };
        expect(applyMagnet(offset, candlestick, undefined, 20)).toBe(offset);
        expect(applyMagnet({ x: 93, y: 100 }, candlestick, 'weak', 5)).toEqual({ x: 93, y: 100 });
    });

    it('snaps from any distance when strong', () => {
        expect(applyMagnet({ x: 93, y: 300 }, candlestick, 'strong', 20)).toEqual({ x: 100, y: 120 });
    });

    it('leaves the point alone when there is nothing to snap to', () => {
        const offset = { x: 500, y: 82 };
        expect(applyMagnet(offset, [], 'strong', 20)).toBe(offset);
    });
});

describe('magnetTranslation', () => {
    // A magnet that pulls any point to y = 50, as a datum with that single value would.
    const context = { magnet: ({ x }: { x: number }) => ({ x, y: 50 }) } as unknown as AnnotationContext;

    it('adjusts a translation so that the point ends on the magnet value', () => {
        // From (10, 20), moving by (5, 25) would end at (15, 45); the magnet moves that to y = 50.
        expect(magnetTranslation({ x: 10, y: 20 }, { x: 5, y: 25 }, context)).toEqual({ x: 5, y: 30 });
    });

    it('moves up or down as the magnet requires', () => {
        expect(magnetTranslation({ x: 10, y: 80 }, { x: -5, y: -10 }, context)).toEqual({ x: -5, y: -30 });
    });

    it('is the translation itself when the point is already on the magnet value', () => {
        expect(magnetTranslation({ x: 10, y: 20 }, { x: 5, y: 30 }, context)).toEqual({ x: 5, y: 30 });
    });

    it('is the translation itself when the magnet does not move the point', () => {
        const off = { magnet: (offset: { x: number; y: number }) => offset } as unknown as AnnotationContext;
        expect(magnetTranslation({ x: 10, y: 20 }, { x: 5, y: 25 }, off)).toEqual({ x: 5, y: 25 });
    });
});
