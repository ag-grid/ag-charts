import { describe, expect, it } from 'vitest';

import { align, deviceDimension } from './pixel';

describe('deviceDimension', () => {
    it('is monotonic and idempotent across a resize sweep at a fractional pixel ratio', () => {
        const pixelRatio = 1.1;
        let previous = -Infinity;
        for (let css = 95; css <= 110; css++) {
            const device = deviceDimension(pixelRatio, css);
            expect(device).toBe(deviceDimension(pixelRatio, css));
            expect(device).toBeGreaterThanOrEqual(previous);
            previous = device;
        }
    });

    it('stabilises half-pixel ties so float jitter does not flip the result ±1px', () => {
        const pixelRatio = 2;
        const boundary = 5.25; // 10.5 device pixels
        const epsilon = 1e-10;

        expect(deviceDimension(pixelRatio, boundary - epsilon)).toBe(deviceDimension(pixelRatio, boundary + epsilon));
    });
});

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
