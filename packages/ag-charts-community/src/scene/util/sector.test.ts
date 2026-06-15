import { describe, expect, it } from 'vitest';

import { clockwiseAngles } from './sector';

const TAU = 2 * Math.PI;

function sweepOf(startAngle: number, endAngle: number) {
    const angles = clockwiseAngles(startAngle, endAngle);
    return angles.endAngle - angles.startAngle;
}

describe('clockwiseAngles', () => {
    it('treats a 2π − ε sweep as a full circle so the Sunburst centre sector is not collapsed to zero', () => {
        // A Sunburst root sector spans total * (2π / total); for some totals (e.g. 79.392)
        // floating-point rounding lands this product one ULP below 2π. Such a sweep must
        // still be treated as a full circle rather than normalised down to 0.
        const total = 79.392;
        const sweep = total * (TAU / total);
        expect(sweep).toBeLessThan(TAU);

        expect(sweepOf(0, sweep)).toBeCloseTo(TAU, 12);
    });

    it('keeps a genuine partial sweep unchanged', () => {
        expect(sweepOf(0, Math.PI)).toBeCloseTo(Math.PI, 12);
    });

    it('treats an exact 2π sweep as a full circle', () => {
        expect(sweepOf(0, TAU)).toBeCloseTo(TAU, 12);
    });
});
