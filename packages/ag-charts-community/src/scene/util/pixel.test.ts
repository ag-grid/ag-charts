import { describe, expect, it } from '@jest/globals';

import { align } from './pixel';

describe('pixel alignment', () => {
    it('stabilises half-pixel ties to avoid seams from tiny floating-point jitter', () => {
        const pixelRatio = 2;
        const boundary = 5.25; // 10.5 device pixels
        const epsilon = 1e-10;

        const alignedBefore = align(pixelRatio, boundary - epsilon);
        const alignedAfter = align(pixelRatio, boundary + epsilon);

        expect(alignedBefore).toBe(alignedAfter);
    });

    it('keeps normal rounding behaviour away from half-pixel ties', () => {
        const pixelRatio = 2;

        expect(align(pixelRatio, 5.24)).toBe(5);
        expect(align(pixelRatio, 5.26)).toBe(5.5);
    });
});
