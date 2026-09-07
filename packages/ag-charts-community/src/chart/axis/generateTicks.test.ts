import { describe, expect, it } from 'vitest';

import type { AgNumericValue } from 'ag-charts-types';

import { LinearScale } from '../../scale/linearScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { estimateScaleTickCount, generateTicks } from './generateTicks';
import { withTemporaryDomain } from './generateTicksUtils';

// A minTickCount close to tickCount makes buildTickData's overlap loop iterate linearly instead of
// converging by binary search, which hangs on deeply zoomed ordinal-time domains.
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

        // The search only converges efficiently while minTickCount stays far below tickCount.
        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });

    it('should allow full binary search range for small domains', () => {
        const result = estimate(100, 300, 0.5);

        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });
});

// The restore must reinstate exact bigint endpoints, or adjacent high-magnitude bigints collapse onto one pixel.
describe('withTemporaryDomain', () => {
    it('restores exact bigint domain endpoints after temporarily narrowing for tick generation', () => {
        const lo = 9_007_199_254_740_990n;
        const hi = 9_007_199_254_741_000n;

        const scale = new LinearScale();
        scale.domain = [lo, hi];
        scale.range = [0, 1000];

        const narrowedDomain: AgNumericValue[] = [Number(lo), Number(hi)];
        withTemporaryDomain(scale, narrowedDomain, () => {});

        expect(scale.convert(lo)).toBeLessThan(scale.convert(hi));

        // Above 2^53 these adjacent bigints share one float64 value, so only exact endpoints keep them distinct.
        const p5 = scale.convert(lo + 5n);
        const p6 = scale.convert(lo + 6n);
        const p7 = scale.convert(lo + 7n);
        expect(p5).toBeLessThan(p6);
        expect(p6).toBeLessThan(p7);
    });
});

// The band flush is measured off the label nodes, which carry the rotation the axis renders with,
// while `createLabelData` compares in a frame that adds `defaultRotation` - so handing the callback
// the latter measures a layout a quarter turn from the one that will be applied.
describe('labelBandOffsets', () => {
    it('is asked for the rotation the axis renders with, not the collision-check frame', () => {
        const scale = new LinearScale();
        scale.domain = [0, 100];
        scale.range = [0, 600];

        const requested: number[] = [];
        const result = generateTicks({
            label: { enabled: true, fontSize: 12, avoidCollisions: true, autoRotate: false } as any,
            // A horizontal axis, where `defaultRotation` is a quarter turn and a `verticalAlign`
            // flush applies.
            parallel: true,
            axisRotation: Math.PI / -2,
            scale,
            domain: [0, 100],
            range: [0, 600],
            visibleRange: [0, 1],
            niceMode: [],
            reverse: false,
            primaryTickCount: undefined,
            defaultTickMinSpacing: 50,
            labelOffset: 0,
            sideFlag: -1,
            interval: undefined,
            labelBandOffsets: (_ticks: unknown, rotation: number) => {
                requested.push(rotation);
                return undefined;
            },
            tickFormatter: () => (value: any) => String(value),
        } as any);

        expect(requested.length).toBeGreaterThan(0);
        for (const rotation of requested) {
            expect(rotation).toBe(result.rotation);
        }
    });
});
