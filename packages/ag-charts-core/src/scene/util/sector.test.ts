import { describe, expect, it } from 'vitest';

import type { BoxBounds } from '../../geometry/boxBounds';
import {
    boxOverlapsSector,
    clampSectorCornerRadii,
    clockwiseAngles,
    isBoxInSector,
    isPointInSector,
    radiiScalingFactor,
    sectorPointTest,
} from './sector';

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

    it('rejects a box straddling the wedge a reflex sector excludes', () => {
        // 350 degrees of ring, so the 10 degrees it excludes lie along the negative x axis. Every corner
        // of the box clears that wedge, while the middle of the box sits in it.
        const reflex: Sector = {
            startAngle: (Math.PI * 185) / 180,
            endAngle: (Math.PI * 175) / 180,
            innerRadius: 40,
            outerRadius: 120,
        };
        const box: BoxBounds = { x: -110, y: -20, width: 50, height: 40 };
        expect(isPointInSector(box.x, box.y, reflex)).toBe(true);
        expect(isPointInSector(box.x, box.y + box.height, reflex)).toBe(true);
        expect(boxInSectorBySampling(box, reflex)).toBe(false);
        expect(isBoxInSector(box, reflex)).toBe(false);
    });

    it('accepts a box a reflex sector holds clear of the wedge it excludes', () => {
        const reflex: Sector = {
            startAngle: (Math.PI * 185) / 180,
            endAngle: (Math.PI * 175) / 180,
            innerRadius: 40,
            outerRadius: 120,
        };
        const box: BoxBounds = { x: 60, y: -20, width: 50, height: 40 };
        expect(boxInSectorBySampling(box, reflex)).toBe(true);
        expect(isBoxInSector(box, reflex)).toBe(true);
    });
});

describe.each([
    ['isPointInSector', (x: number, y: number, sector: Sector) => isPointInSector(x, y, sector)],
    ['sectorPointTest', (x: number, y: number, sector: Sector) => sectorPointTest(sector)(x, y)],
])('%s', (_name, contains) => {
    const at = (radius: number, angle: number): [number, number] => [
        radius * Math.cos(angle),
        radius * Math.sin(angle),
    ];
    const ring = (startAngle: number, endAngle: number, innerRadius = 50, outerRadius = 100): Sector => ({
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
    });

    it.each<[string, Sector, [number, number], boolean]>([
        ['inside a plain sector', ring(0, Math.PI / 2), at(75, Math.PI / 4), true],
        ['beyond the outer radius', ring(0, Math.PI / 2), at(120, Math.PI / 4), false],
        ['inside the hole', ring(0, Math.PI / 2), at(20, Math.PI / 4), false],
        ['outside the angles', ring(0, Math.PI / 2), at(75, Math.PI), false],
        ['on a sector with equal angles', ring(1, 1), at(75, 1), false],
        ['between swapped radii', ring(0, Math.PI / 2, 100, 50), at(75, Math.PI / 4), true],
        ['outside swapped radii', ring(0, Math.PI / 2, 100, 50), at(120, Math.PI / 4), false],
        ['anywhere on a full circle', ring(0, TAU), at(75, 2.5), true],
        ['across the wrap of a sector crossing zero', ring((5 * Math.PI) / 3, TAU + Math.PI / 3), at(75, 0), true],
        ['opposite a sector crossing zero', ring((5 * Math.PI) / 3, TAU + Math.PI / 3), at(75, Math.PI), false],
        ['inside a sector with negative angles', ring(-Math.PI / 2, -Math.PI / 4), at(75, -Math.PI / 3), true],
    ])('answers for a point %s', (_, sector, [x, y], inside) => {
        expect(contains(x, y, sector)).toBe(inside);
    });
});

describe('sector point tests with a radialEdgeInset', () => {
    const quarter: Sector = {
        startAngle: 0,
        endAngle: Math.PI / 2,
        innerRadius: 0,
        outerRadius: 100,
        radialEdgeInset: 5,
    };

    describe.each([
        ['isPointInSector', (x: number, y: number) => isPointInSector(x, y, quarter)],
        ['sectorPointTest', sectorPointTest(quarter)],
    ])('%s', (_name, contains) => {
        it.each([
            { point: [50, 3], inside: false, at: 'within the inset of the start edge' },
            { point: [50, 6], inside: true, at: 'clear of the start edge' },
            { point: [3, 50], inside: false, at: 'within the inset of the end edge' },
            { point: [6, 50], inside: true, at: 'clear of the end edge' },
            { point: [6, 6], inside: true, at: 'clear of both edges near the centre' },
            { point: [4, 4], inside: false, at: 'within the inset of both edges near the centre' },
        ])('treats a point $at as inside: $inside', ({ point: [x, y], inside }) => {
            expect(contains(x, y)).toBe(inside);
        });
    });

    it('insets only along each edge, not across the line it lies on', () => {
        // Three quarters of a turn: (-50, 3) is within 5px of the line through the start edge, but on the far
        // side of the centre from the edge itself.
        const reflex: Sector = { ...quarter, endAngle: Math.PI * 1.5 };
        expect(isPointInSector(-50, 3, reflex)).toBe(true);
    });
});

describe('radiiScalingFactor with no inset', () => {
    it.each([
        { r: 30, sweep: Math.PI / 2, a: -7, b: -7, expected: 1 },
        { r: 30, sweep: Math.PI, a: 0, b: 0, expected: 0 },
        { r: 30, sweep: 0.3, a: -7, b: -7, expected: 0.5546875 },
        { r: 15, sweep: 0.3, a: 7, b: 7, expected: 0.375 },
        { r: 20, sweep: 0.05, a: -5, b: -2, expected: 0.13671875 },
        { r: 30, sweep: 0.5, a: -10, b: 0, expected: 0.96875 },
    ])('scales corners $a and $b at radius $r over $sweep rad by $expected', ({ r, sweep, a, b, expected }) => {
        expect(radiiScalingFactor(r, sweep, a, b)).toBe(expected);
    });
});

describe('clampSectorCornerRadii with no inset', () => {
    it.each([
        { corners: [3, 3, 3, 3], sweep: Math.PI / 2, innerRadius: 0, expected: [3, 3, 0, 0] },
        { corners: [100, 100, 100, 100], sweep: Math.PI / 2, innerRadius: 0, expected: [12.421875, 12.421875, 0, 0] },
        { corners: [8, 8, 8, 8], sweep: Math.PI / 2, innerRadius: 15, expected: [7, 7, 7, 7] },
        { corners: [100, 100, 100, 100], sweep: 1.5 * Math.PI, innerRadius: 15, expected: [7, 7, 7, 7] },
        { corners: [7, 7, 7, 7], sweep: 0.3, innerRadius: 15, expected: [3.890625, 3.890625, 2, 2] },
        { corners: [12, 12, 12, 12], sweep: 0.8, innerRadius: 5, expected: [8.37890625, 8.37890625, 1, 1] },
        { corners: [10, 2, 4, 0], sweep: 1, innerRadius: 10, expected: [10, 2, 4, 0] },
    ])(
        'fits corners $corners over $sweep rad from radius $innerRadius to 30',
        ({ corners, sweep, innerRadius, expected }) => {
            const [startOuter, endOuter, startInner, endInner] = corners;
            const radii = { startOuter, endOuter, startInner, endInner };
            clampSectorCornerRadii(radii, sweep, innerRadius, 30, 0, innerRadius > 0);
            expect([radii.startOuter, radii.endOuter, radii.startInner, radii.endInner]).toEqual(expected);
        }
    );
});
