import { describe, expect, it } from 'vitest';

import { align, alignCentre, centreSnapApplies, deviceDimension } from './pixel';

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

describe('alignCentre', () => {
    const isDeviceInteger = (pixelRatio: number, value: number) =>
        Math.abs(value * pixelRatio - Math.round(value * pixelRatio)) < 1e-9;

    it.each([1, 1.75, 2, 2.5])('snaps both edges to the device grid at pixelRatio %s', (pixelRatio) => {
        for (const start of [10, 44.60625, 141.98125, 336.73]) {
            for (const length of [9, 10, 15.75, 68.1625]) {
                const result = alignCentre(pixelRatio, start, length);
                expect(isDeviceInteger(pixelRatio, result.start)).toBe(true);
                expect(isDeviceInteger(pixelRatio, result.start + result.length)).toBe(true);
            }
        }
    });

    it('rounds the length to a whole number of device pixels', () => {
        const pixelRatio = 1.75;
        // 9 logical * 1.75 = 15.75 device px -> 16 device px = 16/1.75 logical.
        expect(alignCentre(pixelRatio, 44.60625, 9).length).toBeCloseTo(16 / 1.75, 9);
    });

    it('snaps the centre to the nearest crisp device position, unbiased', () => {
        // The snap must be symmetric about the true centre (drift <= 0.5 device px), not biased to one
        // side, which a round-to-boundary-then-offset snap would fail by a whole device pixel.
        for (const pixelRatio of [1, 1.75, 2, 2.5]) {
            for (const centre of [45.5625, 51.5625, 88.5, 100.3, 233.98726, 640.5, 799.1]) {
                for (const length of [8, 9, 9.4, 12, 15]) {
                    const result = alignCentre(pixelRatio, centre - length / 2, length);
                    const deviceWidth = Math.round(result.length * pixelRatio);
                    if (deviceWidth <= 1) continue; // sub-pixel bars edge-snap; covered separately
                    const snappedCentreDev = (result.start + result.length / 2) * pixelRatio;
                    const parityOffset = (deviceWidth % 2) / 2; // 0.5 for odd, 0 for even
                    const nearestCrisp = Math.round(snappedCentreDev - parityOffset) + parityOffset;
                    expect(Math.abs(snappedCentreDev - nearestCrisp)).toBeLessThan(1e-6);
                    expect(Math.abs(snappedCentreDev - centre * pixelRatio)).toBeLessThanOrEqual(0.5 + 1e-6);
                }
            }
        }
    });

    it('is deterministic: identical centre and length snap identically', () => {
        const pixelRatio = 1.75;
        const a = alignCentre(pixelRatio, 44.60625, 9);
        const b = alignCentre(pixelRatio, 44.60625, 9);
        expect(a.start).toBe(b.start);
        expect(a.length).toBe(b.length);
        // Equal widths always produce an equal device-pixel length regardless of position.
        expect(alignCentre(pixelRatio, 141.98125, 9).length).toBeCloseTo(a.length, 9);
    });

    it('centres an even device-width band on a device-pixel boundary', () => {
        const pixelRatio = 2;
        // 5 logical * 2 = 10 device px (even) centred at 20 -> centre stays on a boundary.
        const result = alignCentre(pixelRatio, 15, 10);
        const centreDev = (result.start + result.length / 2) * pixelRatio;
        expect(centreDev).toBe(Math.round(centreDev));
    });

    it('centres an odd device-width band on a device-pixel centre', () => {
        const pixelRatio = 2;
        // 5.5 logical * 2 = 11 device px (odd) -> centre sits on a half-pixel.
        const result = alignCentre(pixelRatio, 15, 5.5);
        const centreDev = (result.start + result.length / 2) * pixelRatio;
        expect(centreDev - Math.floor(centreDev)).toBeCloseTo(0.5, 9);
    });

    it('never collapses a sub-pixel band below one device pixel', () => {
        const pixelRatio = 2;
        expect(alignCentre(pixelRatio, 10, 0.1).length).toBe(0.5); // 1 device px = 1/2 logical
    });

    it('defers a bar at most one device pixel wide to the edge snap', () => {
        // A single-pixel centre snap offsets the origin by half a device pixel, which is jitter-sensitive;
        // such bars must match the plain edge snap instead.
        for (const pixelRatio of [1, 1.75, 2]) {
            const start = 44.60625;
            for (const length of [0.1, 0.4 / pixelRatio, 1 / pixelRatio]) {
                const result = alignCentre(pixelRatio, start, length);
                expect(result.start).toBe(align(pixelRatio, start));
                expect(result.length).toBe(align(pixelRatio, start, length));
            }
        }
    });
});

describe('centreSnapApplies', () => {
    it('is false at or below one device pixel and true above', () => {
        const pixelRatio = 2;
        expect(centreSnapApplies(pixelRatio, 0.4)).toBe(false); // rounds to 1 device px
        expect(centreSnapApplies(pixelRatio, 0.5)).toBe(false); // exactly 1 device px
        expect(centreSnapApplies(pixelRatio, 1)).toBe(true); // 2 device px
    });
});
