import { describe, expect, it } from 'vitest';

import {
    CategoryScale,
    EllipsisChar,
    LinearScale,
    OrdinalTimeScale,
    TimeScale,
    UnitTimeScale,
    getInnerRectSize,
    getMinOuterRectSize,
    isArray,
    measureTextSegments,
    toPlainText,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { estimateScaleTickCount, generateTicks } from './generateTicks';
import { formatTicks, refitAutoRotatedLabels, withTemporaryDomain } from './generateTicksUtils';

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

    // Tick generation swaps the domain in and out once per phase; rebuilding the bands each time is what
    // made a million-point unit-time create allocate them repeatedly.
    it('reuses the unit-time bands across repeated swaps from an empty scale domain', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 1000];
        scale.interval = 'day';
        const niceDomain = () => [new Date(2024, 0, 1), new Date(2024, 11, 31)];

        let bands: readonly Date[] | undefined;
        for (let i = 0; i < 3; i++) {
            withTemporaryDomain(scale, niceDomain(), () => {
                bands ??= scale.bands;
                expect(scale.bands).toBe(bands);
            });
            expect(scale.domain).toEqual([]);
        }

        expect(bands).toHaveLength(366);
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
        rawFirstTickIndex: 0,
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
        const [{ tickLabel, textMetrics }] = refitAutoRotatedLabels(options, ticks, (335 * Math.PI) / 180);

        expect(isArray(tickLabel)).toBe(true);
        expect(textMetrics.width).toBeLessThan(truncatedWidth);
        expect((tickLabel as any[])[0]).toMatchObject({ color: 'red', fontWeight: 'bold' });
    });

    const categoryScale = (domain: string[], width: number) => {
        const scale = new CategoryScale();
        scale.domain = domain;
        scale.range = [0, width];
        return scale;
    };

    const font = { enabled: true, fontSize: 12, fontFamily: 'Verdana', avoidCollisions: true };
    const autoRotation = (335 * Math.PI) / 180;
    const rotatedExtent = ({ width, height }: { width: number; height: number }) =>
        width * Math.abs(Math.sin(autoRotation)) + height * Math.abs(Math.cos(autoRotation));

    it('re-fits a label wrapped to two lines using the height of its one-line re-fit', () => {
        const domain = ['International Freight Services', 'Long Distance Transport Links'];
        const labelRoom = 45;
        const options = {
            scale: categoryScale(domain, 240),
            label: { ...font, wrapping: 'always', maxWidth: 300 },
            isVertical: false,
            labelRoom,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));
        expect(ticks.every((t) => toPlainText(t.tickLabel).includes('\n'))).toBe(true);
        const wrappedHeight = ticks[0].textMetrics.height;

        const refitted = refitAutoRotatedLabels(options, ticks, autoRotation);

        const sin = Math.abs(Math.sin(autoRotation));
        const cos = Math.abs(Math.cos(autoRotation));
        for (const { tickLabel, textMetrics } of refitted) {
            expect(toPlainText(tickLabel)).not.toContain('\n');
            expect(rotatedExtent(textMetrics)).toBeLessThanOrEqual(labelRoom + 0.5);
            // Budgeting with the two-line height would leave this much width at most.
            expect(textMetrics.width).toBeGreaterThan((labelRoom - wrappedHeight * cos) / sin);
        }
    });

    it('clips explicit line breaks to maxHeight when re-fitting an auto-rotated label', () => {
        const domain = ['a'];
        const options = {
            scale: categoryScale(domain, 1000),
            label: { ...font, maxHeight: 20 },
            isVertical: false,
            labelRoom: 200,
            tickFormatter: () => () => 'First line\nSecond line\nThird line',
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));
        const [{ tickLabel, textMetrics }] = refitAutoRotatedLabels(options, ticks, autoRotation);

        expect(textMetrics.height).toBeLessThanOrEqual(20);
        expect(toPlainText(tickLabel)).toContain('First');
        expect(rotatedExtent(textMetrics)).toBeLessThanOrEqual(200.5);
    });

    const numberScale = (ticks: number[]) => {
        const scale = new LinearScale();
        scale.domain = [ticks[0], ticks.at(-1)!];
        scale.range = [0, 1000];
        return scale;
    };

    it.each([undefined, 30])(
        'hides a number label taller than maxHeight with wrapping never (rotation %s)',
        (rotation) => {
            const domain = [0, 50, 100];
            const options = {
                scale: numberScale(domain),
                label: { ...font, rotation, maxHeight: 5 },
                isVertical: false,
                labelRoom: 200,
                tickFormatter: () => (value: unknown) => String(value),
            } as any;

            const ticks = formatTicks(options, formatOptions(domain as any));

            expect(ticks).toHaveLength(3);
            for (const { tickLabel } of ticks) {
                expect(tickLabel).toBe('');
            }
        }
    );

    it.each([undefined, 30])(
        'clips explicit line breaks to maxHeight with wrapping never (rotation %s)',
        (rotation) => {
            const domain = [0, 100];
            const options = {
                scale: numberScale(domain),
                label: { ...font, rotation, maxHeight: 20 },
                isVertical: false,
                labelRoom: 200,
                tickFormatter: () => () => 'First line\nSecond line\nThird line',
            } as any;

            const ticks = formatTicks(options, formatOptions(domain as any));

            for (const { tickLabel, textMetrics } of ticks) {
                expect(textMetrics.height).toBeLessThanOrEqual(20);
                expect(toPlainText(tickLabel)).toContain('First');
                expect(toPlainText(tickLabel)).not.toContain('Second');
            }
        }
    );

    it.each([undefined, 30])(
        'hides a number label when maxWidth is narrower than the ellipsis (rotation %s)',
        (rotation) => {
            const domain = [0, 50, 100];
            const options = {
                scale: numberScale(domain),
                label: { ...font, rotation, maxWidth: 5 },
                isVertical: false,
                labelRoom: 200,
                tickFormatter: () => (value: unknown) => String(value),
            } as any;

            const ticks = formatTicks(options, formatOptions(domain as any));

            expect(ticks).toHaveLength(3);
            for (const { tickLabel } of ticks) {
                expect(tickLabel).toBe('');
            }
        }
    );

    it.each([90, 270, -90])('inner rect at %d° in a box with one infinite side keeps the finite side', (rotation) => {
        expect(getInnerRectSize(rotation, 20, Infinity)).toEqual({ width: Infinity, height: 20 });
        expect(getInnerRectSize(rotation, Infinity, 20)).toEqual({ width: 20, height: Infinity });
    });

    it.each([90, 270])('keeps the labels of a vertical number axis rotated %d° in a tight label room', (rotation) => {
        const domain = [0, 50, 100];
        const labelRoom = 20;
        const options = {
            scale: numberScale(domain),
            label: { ...font, rotation, maxWidth: 200 },
            isVertical: true,
            labelRoom,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;

        const ticks = formatTicks(options, formatOptions(domain as any));

        expect(ticks).toHaveLength(3);
        for (const { tickLabel, textMetrics } of ticks) {
            expect(tickLabel).not.toBe('');
            expect(textMetrics.height).toBeLessThanOrEqual(labelRoom);
        }
    });

    it('hides the labels of a vertical axis with no label room left', () => {
        const domain = [0, 50, 100];
        const options = {
            scale: numberScale(domain),
            label: { ...font, maxHeight: 100 },
            isVertical: true,
            labelRoom: 0,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;

        const ticks = formatTicks(options, formatOptions(domain as any));

        expect(ticks).toHaveLength(3);
        for (const { tickLabel } of ticks) {
            expect(tickLabel).toBe('');
        }
    });

    it('hides a rich-text label when maxWidth is narrower than the ellipsis', () => {
        const domain = ['a'];
        const options = {
            scale: categoryScale(domain, 1000),
            label: { ...font, maxWidth: 5 },
            isVertical: false,
            labelRoom: 200,
            tickFormatter: () => () => [
                { text: 'Styled ', color: 'red' },
                { text: 'label', color: 'blue' },
            ],
        } as any;

        const [{ tickLabel }] = formatTicks(options, formatOptions(domain));

        expect(toPlainText(tickLabel)).toBe('');
    });

    it('keeps a rich-text label within maxWidth when a full first segment leaves too little room for the ellipsis', () => {
        const domain = ['a'];
        const first = { text: 'Styled', color: 'red' };
        const firstWidth = measureTextSegments([first], font).width;
        const ellipsisWidth = measureTextSegments([{ text: EllipsisChar }], font).width;
        const maxWidth = firstWidth + ellipsisWidth / 2;
        const options = {
            scale: categoryScale(domain, 1000),
            label: { ...font, maxWidth },
            isVertical: false,
            labelRoom: 200,
            tickFormatter: () => () => [first, { text: 'label', color: 'blue' }],
        } as any;

        const [{ textMetrics }] = formatTicks(options, formatOptions(domain));

        expect(textMetrics.width).toBeLessThanOrEqual(maxWidth);
    });

    it('hides an auto-rotated label when the width left by its re-fit is narrower than the ellipsis', () => {
        const domain = ['International Freight Services'];
        const options = {
            scale: categoryScale(domain, 1000),
            label: { ...font, maxWidth: 300 },
            isVertical: false,
            labelRoom: 200,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;
        const ticks = formatTicks(options, formatOptions(domain));
        const { height } = ticks[0].textMetrics;
        const sin = Math.abs(Math.sin(autoRotation));
        const cos = Math.abs(Math.cos(autoRotation));

        // Room for the label's height plus 2px of rotated width, less than an ellipsis needs.
        const [{ tickLabel }] = refitAutoRotatedLabels(
            { ...options, labelRoom: height * cos + 2 * sin },
            ticks,
            autoRotation
        );

        expect(tickLabel).toBe('');
    });

    it('does not erase a rich-text label wider than its band when it fits maxWidth with truncate false', () => {
        const domain = ['a', 'b', 'c', 'd'];
        const segments = [
            { text: 'Styled ', color: 'red' },
            { text: 'category label', color: 'blue' },
        ];
        const options = {
            scale: categoryScale(domain, 120),
            label: { ...font, maxWidth: 300, truncate: false },
            isVertical: false,
            labelRoom: 100,
            tickFormatter: () => () => segments,
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));

        expect(ticks).toHaveLength(4);
        for (const { tickLabel, textMetrics } of ticks) {
            expect(toPlainText(tickLabel)).toBe('Styled category label');
            expect(textMetrics.width).toBeGreaterThan(30);
        }
    });

    // Text pads its box before rotating it, so padding on the label's own sides turns into the axis thickness.
    const paddedExtent = (
        { width, height }: { width: number; height: number },
        { left, right, top, bottom }: { left: number; right: number; top: number; bottom: number },
        rotation: number,
        isVertical: boolean
    ) => {
        const sin = Math.abs(Math.sin(rotation));
        const cos = Math.abs(Math.cos(rotation));
        const w = width + left + right;
        const h = height + top + bottom;
        return isVertical ? w * cos + h * sin : w * sin + h * cos;
    };

    it.each([
        [false, 90, { left: 10, right: 10, top: 2, bottom: 2 }],
        [true, 30, { left: 20, right: 20, top: 20, bottom: 20 }],
    ])(
        'keeps the padded box of a label with a configured rotation within the label room (vertical %s, %d°)',
        (isVertical, rotation, padding) => {
            const domain = ['International Freight Services And Logistics'];
            const labelRoom = 120;
            const options = {
                scale: categoryScale(domain, 300),
                label: { ...font, fill: 'white', padding, rotation, maxWidth: 300 },
                isVertical,
                labelRoom,
                tickFormatter: () => (value: unknown) => String(value),
            } as any;

            const [{ tickLabel, textMetrics }] = formatTicks(options, formatOptions(domain));

            expect(toPlainText(tickLabel)).not.toBe('');
            const extent = paddedExtent(textMetrics, padding, (rotation * Math.PI) / 180, isVertical);
            expect(extent).toBeLessThanOrEqual(labelRoom + 0.5);
        }
    );

    it('keeps the padded box of a re-fitted auto-rotated label within the label room', () => {
        const domain = ['International Freight Services And Logistics'];
        const labelRoom = 60;
        const options = {
            scale: categoryScale(domain, 1000),
            label: { ...font, fill: 'white', padding: 8, maxWidth: 300 },
            isVertical: false,
            labelRoom,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));
        const [{ tickLabel, textMetrics }] = refitAutoRotatedLabels(options, ticks, autoRotation);

        expect(toPlainText(tickLabel)).not.toBe('');
        const padding = { left: 8, right: 8, top: 8, bottom: 8 };
        expect(paddedExtent(textMetrics, padding, autoRotation, false)).toBeLessThanOrEqual(labelRoom + 0.5);
    });

    it('never widens or heightens a label when re-fitting with keepWidth', () => {
        const domain = ['International Freight Services', 'Long Distance Transport Links'];
        const options = {
            scale: categoryScale(domain, 240),
            label: { ...font, wrapping: 'always', maxWidth: 300 },
            isVertical: false,
            labelRoom: 45,
            tickFormatter: () => (value: unknown) => String(value),
        } as any;

        const ticks = formatTicks(options, formatOptions(domain));
        const refitted = refitAutoRotatedLabels(options, ticks, autoRotation, true);

        for (const [i, { tickLabel, textMetrics }] of refitted.entries()) {
            expect(toPlainText(tickLabel)).not.toContain('\n');
            expect(textMetrics.width).toBeLessThanOrEqual(ticks[i].textMetrics.width);
            expect(textMetrics.height).toBeLessThanOrEqual(ticks[i].textMetrics.height);
        }
    });

    it('keeps wrapped labels auto-rotated to a shallow angle clear of their neighbours', () => {
        const domain = Array.from({ length: 6 }, (_, i) => `Alpha beta gamma delta epsilon zeta ${i}`);
        const scale = categoryScale(domain, 480);
        const autoRotateAngle = 355;

        const result = generateTicks({
            label: { ...font, autoRotate: true, autoRotateAngle, wrapping: 'always', maxWidth: 300 } as any,
            parallel: true,
            axisRotation: Math.PI / -2,
            scale,
            domain,
            range: [0, 480],
            visibleRange: [0, 1],
            niceMode: [],
            reverse: false,
            primaryTickCount: undefined,
            defaultTickMinSpacing: 0,
            labelOffset: 0,
            sideFlag: 1,
            interval: undefined,
            isVertical: false,
            sizeLimit: 42,
            labelRoom: 42,
            tickFormatter: () => (value: unknown) => String(value),
        } as any);

        // The wrapped labels collide unrotated only through the default 10px spacing, so they rotate.
        expect(result.rotation).toBeCloseTo((autoRotateAngle * Math.PI) / 180);
        expect(result.tickData.ticks).toHaveLength(domain.length);
        const rotation = (autoRotateAngle * Math.PI) / 180;
        for (const { tickLabel, textMetrics } of result.tickData.ticks) {
            expect(toPlainText(tickLabel)).not.toBe('');
            const alongAxis =
                textMetrics.width * Math.abs(Math.cos(rotation)) + textMetrics.height * Math.abs(Math.sin(rotation));
            expect(alongAxis).toBeLessThanOrEqual(scale.step);
        }
    });

    it('does not thin a time axis on the width of labels that maxWidth narrows', () => {
        const domain = [new Date(2025, 0, 1), new Date(2025, 2, 1)];
        const ticksFor = (maxWidth?: number) => {
            const scale = new TimeScale();
            scale.domain = domain;
            scale.range = [0, 400];
            return generateTicks({
                label: { ...font, format: '%A %d %B %Y', maxWidth } as any,
                parallel: true,
                axisRotation: Math.PI / -2,
                scale,
                domain,
                range: [0, 400],
                visibleRange: [0, 1],
                niceMode: [],
                reverse: false,
                primaryTickCount: undefined,
                defaultTickMinSpacing: 0,
                labelOffset: 0,
                sideFlag: 1,
                interval: undefined,
                isVertical: false,
                sizeLimit: 100,
                labelRoom: 100,
                tickFormatter: () => (value: Date) => `Wednesday ${value.getDate()} September`,
            } as any).tickData.ticks;
        };

        const fitted = ticksFor(40);
        expect(fitted.length).toBeGreaterThan(ticksFor().length);
        for (const { textMetrics } of fitted) {
            expect(textMetrics.width).toBeLessThanOrEqual(40);
        }
    });
});
