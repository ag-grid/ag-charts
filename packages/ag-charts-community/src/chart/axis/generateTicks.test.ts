import { describe, expect, it } from 'vitest';

import { LinearScale } from '../../scale/linearScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { estimateScaleTickCount } from './generateTicks';
import { withTemporaryDomain } from './generateTicksUtils';

// AG-17065: for large ordinal-time domains with deep zoom, the binary search in
// buildTickData needs to cover the full tick count range. If minTickCount is too
// high relative to tickCount, the overlap loop iterates linearly instead of
// converging via binary search, causing a hang.
describe('estimateScaleTickCount', () => {
    function estimate(domainLength: number, rangeExtent: number, zoomExtent: number) {
        const scale = new OrdinalTimeScale();
        const domain = Array.from({ length: domainLength }, (_, i) => new Date(2023, 0, 1, 0, i));
        scale.domain = domain;
        scale.range = [0, rangeExtent];

        return estimateScaleTickCount({
            scale,
            domain,
            range: [0, rangeExtent] as [number, number],
            visibleRange: [0.5 - zoomExtent / 2, 0.5 + zoomExtent / 2] as [number, number],
            label: { enabled: true, fontSize: 14, avoidCollisions: true } as any,
            defaultTickMinSpacing: 50,
            interval: undefined,
        } as any);
    }

    it('should allow full binary search range for large domains with deep zoom', () => {
        const result = estimate(10_000, 300, 0.002);

        // The binary search range is (tickCount - minTickCount). For the search to
        // converge efficiently, minTickCount must be much smaller than tickCount.
        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });

    it('should allow full binary search range for small domains', () => {
        const result = estimate(100, 300, 0.5);

        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });
});

// AG-16608: a zoomed update runs tick generation through withTemporaryDomain. If the restore narrowed
// the domain, the scale lost its exact bigint endpoints and adjacent high-magnitude bigints collapsed
// onto one pixel. The restore must reinstate the exact endpoints.
describe('withTemporaryDomain', () => {
    it('restores exact bigint domain endpoints after temporarily narrowing for tick generation', () => {
        const lo = 9_007_199_254_740_990n;
        const hi = 9_007_199_254_741_000n;

        const scale = new LinearScale();
        scale.domain = [lo, hi];
        scale.range = [0, 1000];

        withTemporaryDomain(scale, [Number(lo), Number(hi)], () => {});

        expect(scale.convert(lo)).toBeLessThan(scale.convert(hi));
        expect(scale.convert(lo + 1n)).not.toBe(scale.convert(lo + 2n));
    });
});
