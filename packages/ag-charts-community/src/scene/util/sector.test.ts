import { describe, expect, it } from 'vitest';

import type { BoxBounds } from 'ag-charts-core';

import { boxOverlapsSector, clockwiseAngles, isBoxInSector, isPointInSector } from './sector';

const TAU = 2 * Math.PI;

interface Sector {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}

/** Deterministic LCG so the randomised oracle test is reproducible. */
function makeRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

/**
 * Ground-truth overlap by dense point sampling. A box and an (origin-centred) sector share area iff
 * some point lies in both. Sampling the box interior catches box⊂sector and partial overlaps;
 * sampling the sector annulus catches sector⊂box. Measure-zero edge touches are not sampled, so a
 * rare boundary disagreement with the analytic predicate is expected and tolerated below.
 */
function regionsOverlapBySampling(box: BoxBounds, sector: Sector, steps = 80): boolean {
    for (let i = 0; i <= steps; i++) {
        for (let j = 0; j <= steps; j++) {
            const x = box.x + (box.width * i) / steps;
            const y = box.y + (box.height * j) / steps;
            if (isPointInSector(x, y, sector)) return true;
        }
    }
    const { innerRadius, outerRadius, startAngle, endAngle } = sector;
    const inBox = (x: number, y: number) =>
        x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    for (let i = 0; i <= steps; i++) {
        const r = innerRadius + ((outerRadius - innerRadius) * i) / steps;
        for (let j = 0; j <= steps; j++) {
            const angle = startAngle + ((endAngle - startAngle) * j) / steps;
            if (inBox(r * Math.cos(angle), r * Math.sin(angle))) return true;
        }
    }
    return false;
}

function sweepOf(startAngle: number, endAngle: number) {
    const angles = clockwiseAngles(startAngle, endAngle);
    return angles.endAngle - angles.startAngle;
}

describe('clockwiseAngles', () => {
    it('treats a 2π − ε sweep as a full circle so the Sunburst centre sector is not collapsed to zero', () => {
        // A Sunburst root sector's sweep can land one ULP below 2π, and must still count as a full
        // circle rather than normalise down to 0.
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

describe('boxOverlapsSector', () => {
    it('reports no collision for a box on the opposite side of the origin from the sector', () => {
        // The upper-half sector (angles in (0, π)) occupies positive y only; a box entirely at
        // negative y cannot overlap it.
        const sector: Sector = { startAngle: 0.1, endAngle: Math.PI - 0.1, innerRadius: 0, outerRadius: 100 };
        const box: BoxBounds = { x: -20, y: -60, width: 40, height: 20 };

        expect(regionsOverlapBySampling(box, sector)).toBe(false);
        expect(boxOverlapsSector(box, sector)).toBe(false);
    });

    it('reports no collision for a box sitting inside the donut hole', () => {
        // A box wholly within the inner radius overlaps neither arc nor the filled annulus.
        const sector: Sector = { startAngle: -Math.PI, endAngle: Math.PI, innerRadius: 50, outerRadius: 100 };
        const box: BoxBounds = { x: -10, y: -10, width: 20, height: 20 };

        expect(regionsOverlapBySampling(box, sector)).toBe(false);
        expect(boxOverlapsSector(box, sector)).toBe(false);
    });

    it('reports a collision for a box straddling the annulus', () => {
        const sector: Sector = { startAngle: 0, endAngle: Math.PI / 2, innerRadius: 30, outerRadius: 100 };
        const box: BoxBounds = { x: 40, y: 40, width: 30, height: 30 };

        expect(regionsOverlapBySampling(box, sector)).toBe(true);
        expect(boxOverlapsSector(box, sector)).toBe(true);
    });

    it('agrees with a dense-sampling oracle across random box/sector pairs', () => {
        const rng = makeRng(0x9e3779b9);
        const trials = 5000;
        let disagreements = 0;
        for (let i = 0; i < trials; i++) {
            const innerRadius = rng() * 50;
            const outerRadius = innerRadius + 10 + rng() * 80;
            const startAngle = rng() * TAU - Math.PI;
            const endAngle = startAngle + 0.1 + rng() * (TAU - 0.2);
            const sector: Sector = { startAngle, endAngle, innerRadius, outerRadius };

            const box: BoxBounds = {
                x: rng() * 300 - 150,
                y: rng() * 300 - 150,
                width: 5 + rng() * 55,
                height: 5 + rng() * 55,
            };

            if (boxOverlapsSector(box, sector) !== regionsOverlapBySampling(box, sector)) {
                disagreements++;
            }
        }

        // Only measure-zero boundary grazes should differ from the area-sampling oracle.
        expect(disagreements / trials).toBeLessThan(0.01);
    });
});

describe('isBoxInSector', () => {
    // A ring wide enough to hold a box on its left-hand side, opening to the left so the box straddles
    // the centre line: the arrangement a wrapped sector label lands in.
    const ring: Sector = { startAngle: Math.PI * 0.75, endAngle: Math.PI * 1.25, innerRadius: 40, outerRadius: 120 };

    /** Ground truth: every point of the box has to be in the sector, sampled densely. */
    function boxInSectorBySampling(box: BoxBounds, sector: Sector, steps = 120): boolean {
        for (let i = 0; i <= steps; i++) {
            for (let j = 0; j <= steps; j++) {
                const x = box.x + (box.width * i) / steps;
                const y = box.y + (box.height * j) / steps;
                if (!isPointInSector(x, y, sector)) return false;
            }
        }
        return true;
    }

    it('accepts a box clear of both radii and both edges', () => {
        const box: BoxBounds = { x: -100, y: -12, width: 45, height: 24 };
        expect(isBoxInSector(box, ring)).toBe(true);
        expect(boxInSectorBySampling(box, ring)).toBe(true);
    });

    it('rejects a box whose right edge dips into the hole between its corners', () => {
        // Both right-hand corners clear the 40px hole (their radius is hypot(38, 20) > 40), but the
        // middle of that edge sits 38px out and is inside it.
        const box: BoxBounds = { x: -90, y: -20, width: 52, height: 40 };
        expect(isPointInSector(box.x + box.width, box.y, ring)).toBe(true);
        expect(isPointInSector(box.x + box.width, box.y + box.height, ring)).toBe(true);
        expect(boxInSectorBySampling(box, ring)).toBe(false);
        expect(isBoxInSector(box, ring)).toBe(false);
    });

    it('rejects a box reaching past the outer radius', () => {
        const box: BoxBounds = { x: -130, y: -10, width: 40, height: 20 };
        expect(isBoxInSector(box, ring)).toBe(false);
    });

    it('rejects a box crossing an angular edge', () => {
        const box: BoxBounds = { x: -80, y: -60, width: 40, height: 30 };
        expect(isBoxInSector(box, ring)).toBe(false);
    });
});
