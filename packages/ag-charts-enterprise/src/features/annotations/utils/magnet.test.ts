import { describe, expect, it } from 'vitest';

import { type MagnetSeries, applyMagnet, nearestMagnetPosition, resolveMagnetMode } from './magnet';

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

describe('nearestMagnetPosition', () => {
    const candidates = [10, 40, 90];

    it.each([
        { mode: 'weak', position: 41, range: 20, expected: 40 },
        { mode: 'weak', position: 65, range: 20, expected: undefined },
        { mode: 'weak', position: 60, range: 20, expected: 40 },
        { mode: 'weak', position: 60, range: 30, expected: 40 },
        { mode: 'strong', position: 60, range: 1, expected: 40 },
        { mode: 'strong', position: 500, range: 1, expected: 90 },
    ] as const)('$mode at $position within $range is $expected', ({ mode, position, range, expected }) => {
        expect(nearestMagnetPosition(position, candidates, mode, range)).toBe(expected);
    });

    it('ignores candidates that are not finite and has nothing to snap to without any', () => {
        expect(nearestMagnetPosition(5, [Number.NaN, Infinity], 'strong', 20)).toBeUndefined();
        expect(nearestMagnetPosition(5, [], 'strong', 20)).toBeUndefined();
    });
});

describe('applyMagnet', () => {
    // A candlestick at x = 100 with open, high, low and close values.
    const candlesticks: MagnetSeries<number> = {
        pickNearest: ({ x }) => (Math.abs(x - 100) <= 30 ? 100 : undefined),
        yPositions: () => [20, 50, 120, 80],
    };

    it('only changes the vertical position', () => {
        expect(applyMagnet({ x: 93, y: 82 }, [candlesticks], 'weak')).toEqual({ x: 93, y: 80 });
    });

    it('leaves the point alone when there is no mode or it is out of range', () => {
        const offset = { x: 93, y: 82 };
        expect(applyMagnet(offset, [candlesticks], undefined)).toBe(offset);
        expect(applyMagnet({ x: 93, y: 100 }, [candlesticks], 'weak', 5)).toEqual({ x: 93, y: 100 });
    });

    it('snaps from any distance when strong', () => {
        expect(applyMagnet({ x: 93, y: 300 }, [candlesticks], 'strong')).toEqual({ x: 93, y: 120 });
    });

    it('leaves the point alone when no series has a datum nearby', () => {
        const offset = { x: 500, y: 82 };
        expect(applyMagnet(offset, [candlesticks], 'strong')).toBe(offset);
    });

    it('snaps to the nearest value across series', () => {
        const line: MagnetSeries<number> = { pickNearest: () => 1, yPositions: () => [70] };
        expect(applyMagnet({ x: 93, y: 68 }, [candlesticks, line], 'weak')).toEqual({ x: 93, y: 70 });
    });
});
