import { expect } from 'vitest';

type Pixels = { data: ArrayLike<number> };

/** How many bytes of two renders differ by more than `tolerance`. */
export function differingBytes(a: Pixels, b: Pixels, tolerance = 0) {
    let count = 0;
    for (let i = 0; i < a.data.length; i++) {
        if (Math.abs(a.data[i] - b.data[i]) > tolerance) count++;
    }
    return count;
}

/** The sum of how far each byte of two renders differs: how much of the picture changed, not how far its most changed byte moved. */
export function byteDifference(a: Pixels, b: Pixels) {
    let total = 0;
    for (let i = 0; i < a.data.length; i++) total += Math.abs(a.data[i] - b.data[i]);
    return total;
}

/**
 * Asserts that two canvases hold the same bytes. Unlike `toMatchImage`, it allows no differing pixel at all, unless a
 * `tolerance` lets a byte differ by up to that much, for a render that rounds a shadow's alpha another way.
 */
export function expectSamePixels(actual: Pixels, expected: Pixels, tolerance = 0) {
    expect(actual.data.length).toBe(expected.data.length);
    expect(differingBytes(actual, expected, tolerance)).toBe(0);
}
