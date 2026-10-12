import { describe, expect, it } from 'vitest';

import { CategoryScale, LinearScale, OrdinalTimeScale, getMinOuterRectSize, isArray } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { estimateScaleTickCount, generateTicks } from './generateTicks';
import { formatTicks, getInnerRectSize, refitAutoRotatedLabels, withTemporaryDomain } from './generateTicksUtils';

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

// A label fitted to maxWidth / maxHeight must stay within the room across the axis once rotated, or it can
// overlap an outer scrollbar.
describe('AG-18833 rotated label fitting', () => {
    const formatOptions = (domain: string[]) => ({
        niceDomain: domain,
        rawTicks: domain,
        generatePrimaryTicks: false,
        primaryTicksIndices: undefined,
        alignment: undefined,
        fractionDigits: 0,
        timeInterval: undefined,
    });

    it.each([
        [30, 40, 100],
        [30, 100, 40],
        [15, 50, 300],
        [60, 40, 100],
        [45, 40, 100],
        [120, 40, 100],
        [335, 300, 50],
        [30, 100, 100],
    ])('inner rect at %d° fits a %d × %d box once rotated', (rotation, width, height) => {
        const inner = getInnerRectSize(rotation, width, height);
        const outer = getMinOuterRectSize(rotation, inner.width, inner.height);
        expect(inner.width).toBeGreaterThan(0);
        expect(inner.height).toBeGreaterThan(0);
        expect(outer.width).toBeLessThanOrEqual(width + 1e-6);
        expect(outer.height).toBeLessThanOrEqual(height + 1e-6);
    });

    it('keeps wrapped labels with a configured rotation within the label room', () => {
        const domain = ['one two three four five six seven eight nine ten', 'eleven twelve thirteen fourteen'];
        const scale = new CategoryScale();
        scale.domain = domain;
        scale.range = [0, 200];
        const rotation = 30;
        const labelRoom = 40;

        const ticks = formatTicks(
            {
                scale,
                label: {
                    enabled: true,
                    fontSize: 12,
                    fontFamily: 'Verdana',
                    avoidCollisions: true,
                    rotation,
                    wrapping: 'always',
                    maxWidth: 200,
                },
                isVertical: true,
                sizeLimit: labelRoom,
                labelRoom,
                tickFormatter: () => (value: unknown) => String(value),
            } as any,
            formatOptions(domain)
        );

        expect(scale.bandwidth).toBeGreaterThan(labelRoom);
        expect(ticks).toHaveLength(2);
        for (const { tickLabel, textMetrics } of ticks) {
            expect(tickLabel).not.toBe('');
            const outer = getMinOuterRectSize(rotation, textMetrics.width, textMetrics.height);
            expect(outer.width).toBeLessThanOrEqual(labelRoom + 0.5);
        }
    });

    it('keeps rich-text segments when re-fitting an auto-rotated truncated label', () => {
        const domain = ['a'];
        const scale = new CategoryScale();
        scale.domain = domain;
        scale.range = [0, 1000];
        const segments = [
            { text: 'International ', color: 'red', fontWeight: 'bold' },
            { text: 'Freight Services And Logistics', color: 'blue' },
        ];
        const options = {
            scale,
            label: { enabled: true, fontSize: 12, fontFamily: 'Verdana', avoidCollisions: true, maxWidth: 150 },
            isVertical: false,
            labelRoom: 60,
            tickFormatter: () => () => segments,
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));
        expect(ticks[0].textUntruncated).toBeDefined();

        const truncatedWidth = ticks[0].textMetrics.width;
        refitAutoRotatedLabels(options, ticks, (335 * Math.PI) / 180);

        const { tickLabel, textMetrics } = ticks[0];
        expect(isArray(tickLabel)).toBe(true);
        expect(textMetrics.width).toBeLessThan(truncatedWidth);
        expect((tickLabel as any[])[0]).toMatchObject({ color: 'red', fontWeight: 'bold' });
    });
});
