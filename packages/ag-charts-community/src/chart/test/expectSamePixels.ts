import { expect } from 'vitest';

/** Asserts that two canvases hold the same bytes. Unlike `toMatchImage`, it allows no differing pixel at all. */
export function expectSamePixels(actual: { data: Uint8ClampedArray }, expected: { data: Uint8ClampedArray }) {
    expect(actual.data.length).toBe(expected.data.length);
    let differing = 0;
    for (let i = 0; i < actual.data.length; i++) {
        if (actual.data[i] !== expected.data[i]) differing++;
    }
    expect(differing).toBe(0);
}
