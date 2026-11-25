import { describe, expect, it } from 'vitest';

import { trapezoidFitRegion } from './fitRegion';
import {
    insetItemRect,
    insetItemRegion,
    insetItemSector,
    insetItemSpan,
    itemContentInset,
    itemEdgeInset,
    itemLabelClearance,
    itemStrokeDepth,
} from './itemPadding';

describe('itemPadding', () => {
    const rect = { x: 10, y: 20, width: 40, height: 200 };

    describe('itemStrokeDepth', () => {
        it.each([
            { stroke: 'red', strokeWidth: 4, centred: false, expected: 4 },
            { stroke: 'red', strokeWidth: 4, centred: true, expected: 2 },
            { stroke: undefined, strokeWidth: 4, centred: false, expected: 0 },
            { stroke: '', strokeWidth: 4, centred: true, expected: 0 },
            { stroke: 'red', strokeWidth: 0, centred: false, expected: 0 },
            { stroke: 'red', strokeWidth: undefined, centred: false, expected: 0 },
        ])('reaches $expected in for stroke $stroke at $strokeWidth (centred $centred)', (c) => {
            expect(itemStrokeDepth(c.stroke, c.strokeWidth, c.centred)).toBe(c.expected);
        });
    });

    describe('itemContentInset', () => {
        it.each([
            { padding: 3, depth: 5, expected: 5 },
            { padding: 5, depth: 3, expected: 5 },
            { padding: -2, depth: 5, expected: 3 },
            { padding: -8, depth: 5, expected: 0 },
            { padding: 2, depth: 0, expected: 2 },
            { padding: -2, depth: 0, expected: 0 },
        ])('holds a label $expected in at padding $padding over a stroke $depth deep', (c) => {
            expect(itemContentInset(c.padding, c.depth)).toBe(c.expected);
        });
    });

    describe('itemEdgeInset', () => {
        it.each([
            { itemPadding: 2, reserved: 0, expected: 2 },
            { itemPadding: 2, reserved: 8, expected: 8 },
            { itemPadding: 6, reserved: 4, expected: 6 },
        ])('holds an edge reserving $reserved off by $expected at itemPadding $itemPadding', (c) => {
            expect(itemEdgeInset(c.itemPadding, c.reserved)).toBe(c.expected);
        });
    });

    describe('insetItemSpan', () => {
        it.each([
            { size: 40, reservedLow: 0, reservedHigh: 0, expected: 36 },
            { size: 40, reservedLow: 5, reservedHigh: 0, expected: 33 },
            { size: 3, reservedLow: 0, reservedHigh: 0, expected: 0 },
        ])('leaves $expected of $size at itemPadding 2', (c) => {
            expect(insetItemSpan(c.size, 2, c.reservedLow, c.reservedHigh)).toBe(c.expected);
        });
    });

    describe('insetItemRect', () => {
        it('moves every edge in by itemPadding', () => {
            expect(insetItemRect(rect, 3)).toEqual({ x: 13, y: 23, width: 34, height: 194 });
        });

        it.each([
            { isVertical: true, expected: { x: 12, y: 25, width: 36, height: 193 } },
            { isVertical: false, expected: { x: 15, y: 22, width: 33, height: 196 } },
        ])('keeps the larger of a value-axis reservation and itemPadding (vertical $isVertical)', (c) => {
            expect(insetItemRect(rect, 2, 5, 0, c.isVertical)).toEqual(c.expected);
        });

        it('leaves the rect as it is at zero', () => {
            expect(insetItemRect(rect, 0)).toEqual(rect);
        });

        it('never reports a negative size', () => {
            expect(insetItemRect({ x: 0, y: 0, width: 3, height: 3 }, 2)).toEqual({ x: 2, y: 2, width: 0, height: 0 });
        });
    });

    describe('itemLabelClearance', () => {
        it('adds the larger side of the drawn box on each axis', () => {
            const box = { top: 1, right: 4, bottom: 3, left: 2 };
            expect(itemLabelClearance(2, box)).toEqual({ x: 6, y: 5 });
        });

        it('is itemPadding alone for a label with no box', () => {
            expect(itemLabelClearance(2)).toEqual({ x: 2, y: 2 });
        });
    });

    describe('insetItemRegion', () => {
        const stage = { spanLo: 0, spanHi: 100, extentLo: 40, extentHi: 200, crossCentre: 0, vertical: true };
        const region = trapezoidFitRegion(stage, 50);

        it('narrows every band and shortens the extents by the clearance', () => {
            const inset = insetItemRegion(region, { x: 4, y: 6 });
            const [left, right] = region.spanAt(-16, 16);
            expect(inset.spanAt(-10, 10)).toEqual([left + 4, right - 4]);
            expect(inset.extentAbove).toBe(region.extentAbove - 6);
            expect(inset.extentBelow).toBe(region.extentBelow - 6);
        });

        it('returns the region itself when there is no clearance', () => {
            expect(insetItemRegion(region, { x: 0, y: 0 })).toBe(region);
        });
    });

    describe('insetItemSector', () => {
        it('moves both arcs and both straight edges in', () => {
            const sector = { startAngle: 0, endAngle: 1, innerRadius: 20, outerRadius: 100, radialEdgeInset: 1 };
            expect(insetItemSector(sector, 2)).toEqual({
                startAngle: 0,
                endAngle: 1,
                innerRadius: 22,
                outerRadius: 98,
                radialEdgeInset: 3,
            });
        });

        it('closes a ring thinner than twice itemPadding rather than turning it inside out', () => {
            const sector = { startAngle: 0, endAngle: 1, innerRadius: 50, outerRadius: 53 };
            const { innerRadius, outerRadius } = insetItemSector(sector, 4);
            expect(innerRadius).toBe(49);
            expect(outerRadius).toBe(49);
        });

        it('keeps a sector with no hole reaching its centre', () => {
            const sector = { startAngle: 0, endAngle: 1, innerRadius: 0, outerRadius: 100 };
            expect(insetItemSector(sector, 2)).toEqual({
                startAngle: 0,
                endAngle: 1,
                innerRadius: 0,
                outerRadius: 98,
                radialEdgeInset: 2,
            });
        });

        it('leaves the straight edges of a full turn alone, as it has none to move in', () => {
            const sector = { startAngle: 0, endAngle: 2 * Math.PI, innerRadius: 20, outerRadius: 100 };
            expect(insetItemSector(sector, 2)).toEqual({
                startAngle: 0,
                endAngle: 2 * Math.PI,
                innerRadius: 22,
                outerRadius: 98,
            });
        });

        it('moves the sector it is given rather than allocating another', () => {
            const sector = { startAngle: 0, endAngle: 1, innerRadius: 0, outerRadius: -100 };
            expect(insetItemSector(sector, 2)).toBe(sector);
            expect(sector.outerRadius).toBe(-98);
        });

        it('returns the sector itself at zero', () => {
            const sector = { startAngle: 0, endAngle: 1, innerRadius: 0, outerRadius: 100 };
            expect(insetItemSector(sector, 0)).toBe(sector);
        });
    });
});
