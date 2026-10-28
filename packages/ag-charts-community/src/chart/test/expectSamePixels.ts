import { expect } from 'vitest';

/**
 * Asserts that two canvases hold the same bytes. Unlike `toMatchImage`, it allows no differing pixel at all, unless a
 * `tolerance` lets a byte differ by up to that much, for a render that rounds a shadow's alpha another way.
 */
export function expectSamePixels(
    actual: { data: ArrayLike<number> },
    expected: { data: ArrayLike<number> },
    tolerance = 0
) {
    expect(actual.data.length).toBe(expected.data.length);
    let differing = 0;
    for (let i = 0; i < actual.data.length; i++) {
        if (Math.abs(actual.data[i] - expected.data[i]) > tolerance) differing++;
    }
    expect(differing).toBe(0);
}
