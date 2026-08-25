import { describe, expect, it } from 'vitest';

import {
    type LabelFit,
    type NormalisedTextOrSegments,
    fitLabelText,
    resolveLabelFit,
    sectorLabelContainer,
} from 'ag-charts-core';
import type { TextWrap } from 'ag-charts-types';

import { isPointInSector } from '../scene/util/sector';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { setupMockConsole } from '../util/test/mockConsole';
import { buildBarLabelCandidates, fitLabelToContainer, fitSectorLabelRect, insideMarkerContainer } from './labelUtil';

const ELLIPSIS = '…';
const FONT = { fontFamily: 'Verdana', fontSize: 15 };
const LONG_TEXT = 'A very long label that will not fit';

// Resolve the fit the way a series does before fitting, so the tests exercise the same path as production.
function fitToContainer(
    text: NormalisedTextOrSegments,
    fit: { maxWidth?: number; maxHeight?: number; wrapping?: TextWrap; truncate?: boolean; avoid?: boolean },
    container: { width: number; height: number } | undefined
) {
    const { avoid = false, ...fitFields } = fit;
    return fitLabelToContainer(text, resolveLabelFit(fitFields, avoid), FONT, container);
}

describe('fitLabelToContainer', () => {
    setupMockConsole();
    setupMockCanvas();

    it('returns the text unchanged when the policy resolves to show (no truncate, no avoidance)', () => {
        expect(fitToContainer(LONG_TEXT, { maxWidth: 30 }, { width: 30, height: 100 })).toBe(LONG_TEXT);
        expect(fitToContainer(LONG_TEXT, {}, { width: 10, height: 10 })).toBe(LONG_TEXT);
    });

    it('clips to the container when no explicit bound is set', () => {
        const result = fitToContainer(LONG_TEXT, { truncate: true }, { width: 40, height: 100 });
        expect(result).not.toBe(LONG_TEXT);
        expect(result).toContain(ELLIPSIS);
    });

    it('behaves like explicit-only fit when no container is supplied', () => {
        expect(fitToContainer(LONG_TEXT, { maxWidth: 40, truncate: true }, undefined)).toBe(
            fitLabelText(
                LONG_TEXT,
                { maxWidth: 40, maxHeight: undefined, wrapping: undefined, overflowStrategy: 'ellipsis' },
                FONT
            )
        );
    });

    it('applies the explicit bound when it is tighter than the container', () => {
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitToContainer(LONG_TEXT, { maxWidth: 40, truncate: true }, { width: 400, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('applies the container bound when it is tighter than the explicit bound', () => {
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitToContainer(LONG_TEXT, { maxWidth: 400, truncate: true }, { width: 40, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('threads wrapping and truncate through to the fit', () => {
        const result = fitToContainer(
            'one two three four',
            { wrapping: 'on-space', truncate: true },
            {
                width: 60,
                height: 400,
            }
        );
        expect(typeof result).toBe('string');
        // on-space wrapping breaks the label across multiple lines within the narrow container.
        expect(String(result)).toContain('\n');
    });

    it('keeps the text whole when a wrapping mode is set without truncate', () => {
        expect(fitToContainer(LONG_TEXT, { wrapping: 'never' }, { width: 40, height: 100 })).toBe(LONG_TEXT);
        const wrapped = String(fitToContainer(LONG_TEXT, { wrapping: 'on-space' }, { width: 60, height: 100 }));
        expect(wrapped).toContain('\n');
        expect(wrapped).not.toContain(ELLIPSIS);
        expect(wrapped.replaceAll('\n', ' ')).toBe(LONG_TEXT);
    });

    it('resolves collision avoidance to a hide overflow', () => {
        const expected: LabelFit = { maxWidth: 30, maxHeight: 100, wrapping: undefined, overflowStrategy: 'hide' };
        expect(fitToContainer(LONG_TEXT, { avoid: true }, { width: 30, height: 100 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('preserves rich-text segments as an array', () => {
        const segments = [{ type: 'text' as const, text: LONG_TEXT }];
        const result = fitToContainer(segments, { truncate: true }, { width: 40, height: 100 });
        expect(Array.isArray(result)).toBe(true);
    });
});

describe('insideMarkerContainer', () => {
    setupMockConsole();
    setupMockCanvas();

    it('returns the largest square inscribed in the marker circle', () => {
        const { width, height } = insideMarkerContainer(20);
        expect(width).toBeCloseTo(20 / Math.SQRT2);
        expect(height).toBeCloseTo(20 / Math.SQRT2);
        // The square's diagonal equals the marker diameter, so its corners lie on the circle.
        expect(Math.hypot(width, height)).toBeCloseTo(20);
    });

    it('scales the analysed shape rectangle by the marker diameter', () => {
        const small = insideMarkerContainer(50, 'square');
        const large = insideMarkerContainer(100, 'square');
        expect(large.width).toBeCloseTo(small.width * 2);
        expect(large.height).toBeCloseTo(small.height * 2);
        // A square marker uses almost its whole box.
        expect(large.width).toBeGreaterThan(90);
    });

    it('gives a heart a wide, short box and a diamond a smaller near-square one', () => {
        const heart = insideMarkerContainer(100, 'heart');
        const diamond = insideMarkerContainer(100, 'diamond');
        expect(heart.width).toBeGreaterThan(heart.height * 2);
        expect(diamond.width).toBeGreaterThan(40);
        expect(diamond.width).toBeLessThan(60);
    });

    it('falls back to the inscribed square for an unanalysable (empty) custom shape', () => {
        const side = 20 / Math.SQRT2;
        expect(insideMarkerContainer(20, () => {}).width).toBeCloseTo(side);
        expect(insideMarkerContainer(20).width).toBeCloseTo(side);
    });

    it('collapses to an empty container for a markerless point', () => {
        expect(insideMarkerContainer(0)).toEqual({ width: 0, height: 0 });
    });

    it('hides an inside label that overflows a small marker', () => {
        const result = fitToContainer(LONG_TEXT, { avoid: true }, insideMarkerContainer(12));
        expect(result).toBe('');
    });
});

describe('fitSectorLabelRect', () => {
    setupMockConsole();

    const sector = (midAngle: number, halfSpan: number, innerRadius: number, outerRadius: number) => ({
        startAngle: midAngle - halfSpan,
        endAngle: midAngle + halfSpan,
        innerRadius,
        outerRadius,
    });
    const anchorAt = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    const cornersInSector = (rect: ReturnType<typeof fitSectorLabelRect>, s: Parameters<typeof isPointInSector>[2]) => {
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        return [
            [rect.centerX - hw, rect.centerY - hh],
            [rect.centerX + hw, rect.centerY - hh],
            [rect.centerX + hw, rect.centerY + hh],
            [rect.centerX - hw, rect.centerY + hh],
        ].every(([x, y]) => isPointInSector(x, y, s));
    };

    it('recentres a tilted-wedge label off the bisector while keeping the box in the sector', () => {
        // A wedge whose bisector is neither horizontal nor vertical: a horizontal label is not symmetric about
        // it, so the placement must shift off the anchor to sit evenly in the wedge.
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14);
        expect(Math.hypot(rect.centerX - anchor.x, rect.centerY - anchor.y)).toBeGreaterThan(1);
        expect(cornersInSector(rect, s)).toBe(true);
    });

    it('keeps the size from sectorLabelContainer, only moving the centre', () => {
        const s = sector(Math.PI / 2, Math.PI / 6, 40, 120);
        const anchor = anchorAt(85, Math.PI / 2);
        const rect = fitSectorLabelRect(anchor, s, 14);
        const size = sectorLabelContainer(anchor, s, 14);
        expect(rect.width).toBeCloseTo(size.width);
        expect(rect.height).toBeCloseTo(size.height);
    });

    it('leaves an anchor at the centre unchanged', () => {
        const rect = fitSectorLabelRect({ x: 0, y: 0 }, sector(0, Math.PI / 4, 0, 120), 14);
        expect(rect).toMatchObject({ centerX: 0, centerY: 0, width: 0, height: 0 });
    });

    it('fits a multi-line label to the widest band, filling the wedge further out than the bisector', () => {
        // The closing sector's trailing radial edge is vertical, which caps a bisector-symmetric box, so a
        // tall label must instead span the wedge's true width furthest out, where the wedge is widest.
        const s = {
            startAngle: -Math.PI / 2 + 0.86 * 2 * Math.PI,
            endAngle: -Math.PI / 2 + 2 * Math.PI,
            innerRadius: 0,
            outerRadius: 280,
        };
        const mid = (s.startAngle + s.endAngle) / 2;
        const anchor = anchorAt(140, mid);
        const container = sectorLabelContainer(anchor, s, 16);
        const rect = fitSectorLabelRect(anchor, s, 16);
        // The box is multi-line (the branch under test), the placement spans more than the symmetric reach,
        // sits further from the chart centre than the bisector anchor, and still fits the wedge.
        expect(container.height).toBeGreaterThan(16 * 1.5);
        expect(rect.width).toBeGreaterThan(container.width);
        expect(Math.hypot(rect.centerX, rect.centerY)).toBeGreaterThan(Math.hypot(anchor.x, anchor.y));
        expect(cornersInSector(rect, s)).toBe(true);
    });
});

describe('buildBarLabelCandidates', () => {
    // A horizontal bar, upward, spacing 5; a 30×10 label. `getMinOuterRectSize`/`labelGlyphCentre` are
    // pure, so no canvas is needed here.
    const rect = { x: 0, y: 0, width: 100, height: 40 };
    // A styled label stub; the box extent is resolved per placement from insideStyle/outsideStyle. A
    // boxless label (no fill/border) yields a zero extent, so the footprint equals the raw text size.
    const makeLabel = (insideStyle: any = {}, outsideStyle: any = {}) =>
        ({ padding: undefined, fill: undefined, border: undefined, insideStyle, outsideStyle }) as any;
    const build = (placements: any[], orientations: any[], label: any = makeLabel(), overrides: object = {}) =>
        buildBarLabelCandidates({
            isUpward: true,
            isVertical: false,
            placements,
            orientations,
            spacing: 5,
            label,
            textWidth: 30,
            textHeight: 10,
            rect,
            ...overrides,
        });

    it('emits one candidate per placement (outer) × orientation (inner), in cascade order', () => {
        const candidates = build(['inside-center', 'outside-end'], ['horizontal', 'vertical']);
        expect(candidates.map((c) => [c.placement, c.rotation])).toEqual([
            ['inside-center', undefined],
            ['inside-center', -90],
            ['outside-end', undefined],
            ['outside-end', -90],
        ]);
    });

    it('constrains inside placements to the bar rect and floats outside placements', () => {
        // A centred inside label reserves nothing on the length axis - the anchor offset delivers the
        // one-sided spacing - and collision clearance belongs to the engine, not the region.
        const candidates = build(['inside-center', 'outside-end'], ['horizontal']);
        expect(candidates[0].region).toEqual(rect);
        expect(candidates[1].region).toBeUndefined();
    });

    it('centres each candidate box on the (orientation-invariant) glyph centre, sized to its footprint', () => {
        const [horizontal, vertical] = build(['inside-center'], ['horizontal', 'vertical']);
        const expectBox = (box: (typeof horizontal)['box'], expected: typeof rect) => {
            expect(box.x).toBeCloseTo(expected.x);
            expect(box.y).toBeCloseTo(expected.y);
            expect(box.width).toBeCloseTo(expected.width);
            expect(box.height).toBeCloseTo(expected.height);
        };
        // inside-center anchors at the rect centre (50, 20); horizontal keeps the 30×10 footprint.
        expectBox(horizontal.box, { x: 35, y: 15, width: 30, height: 10 });
        // Vertical rotates the footprint to 10×30 about the same centre.
        expectBox(vertical.box, { x: 45, y: 5, width: 10, height: 30 });
        expect(vertical.box.x + vertical.box.width / 2).toBeCloseTo(horizontal.box.x + horizontal.box.width / 2);
        expect(vertical.box.y + vertical.box.height / 2).toBeCloseTo(horizontal.box.y + horizontal.box.height / 2);
    });

    it('sizes each candidate by its own placement style padding, not a shared one', () => {
        // inside padding 0, outside padding 20 (both boxed via fill). A shared box extent would size both
        // candidates identically; per-placement resolution sizes each to its own style.
        const label = makeLabel({ fill: 'red', padding: 0 }, { fill: 'red', padding: 20 });
        const [inside, outside] = build(['inside-center', 'outside-end'], ['horizontal'], label);
        // inside-center keeps the raw 30×10 footprint (0 padding).
        expect(inside.box.width).toBeCloseTo(30);
        expect(inside.box.height).toBeCloseTo(10);
        // outside-end reserves its own 20px padding on every side (30+40 × 10+40).
        expect(outside.box.width).toBeCloseTo(70);
        expect(outside.box.height).toBeCloseTo(50);
    });

    it('holds a candidate shape clear of the box drawn around the glyph', () => {
        // A shape reports the room the mark offers, which the drawn box eats into: a taper's full width at
        // a band is not the text's to use when 6px of padding is drawn around it.
        const shape = { spanAt: () => [-50, 50] as const, extentAbove: 50, extentBelow: 50 };
        const label = makeLabel({ fill: 'red', padding: 6 });
        const [inside] = build(['inside-center'], ['horizontal'], label, {
            fitted: true,
            shapeAt: () => shape,
        });
        expect(inside.fitTo?.shape?.spanAt(0, 10)).toEqual([-44, 44]);
        expect(inside.fitTo?.shape?.extentAbove).toBe(44);
    });

    it('leaves a candidate shape as it is for a label with no box to draw', () => {
        const shape = { spanAt: () => [-50, 50] as const, extentAbove: 50, extentBelow: 50 };
        const [inside] = build(['inside-center'], ['horizontal'], makeLabel(), {
            fitted: true,
            shapeAt: () => shape,
        });
        expect(inside.fitTo?.shape).toBe(shape);
    });

    it('emits no candidate when a hideable label has every placement rejected', () => {
        // The lone placement points into a stacked neighbour; a hideable label is dropped rather than
        // mislabelling that neighbour.
        expect(build(['outside-end'], ['horizontal'], makeLabel(), { rejectOutsideEnd: true, hideable: true })).toEqual(
            []
        );
    });

    it('restores the rejected placements when the label must be shown', () => {
        const candidates = build(['outside-end'], ['horizontal'], makeLabel(), { rejectOutsideEnd: true });
        expect(candidates.map((c) => c.placement)).toEqual(['outside-end']);
    });

    it('keeps the surviving placements when only some are rejected', () => {
        const candidates = build(['outside-end', 'inside-center'], ['horizontal'], makeLabel(), {
            rejectOutsideEnd: true,
            hideable: true,
        });
        expect(candidates.map((c) => c.placement)).toEqual(['inside-center']);
    });
});
