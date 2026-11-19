import { describe, expect, it, vi } from 'vitest';

import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { isBoxInSector, isPointInSector } from '../scene/util/sector';
import { fitSectorLabelRect, sectorLabelPlacer, sectorLabelRoom } from './sectorLabelFit';

// jsdom has no canvas, so cachedTextMeasurer's real createCanvasContext throws. Every character is 10px
// wide and every line 20px tall.
vi.mock('../rendering/canvasUtil', () => ({
    createCanvasContext: () => ({
        font: '',
        measureText: (text: string) => ({
            width: [...text].length * 10,
            fontBoundingBoxAscent: 16,
            fontBoundingBoxDescent: 4,
            emHeightAscent: 16,
            emHeightDescent: 4,
        }),
    }),
}));

const sector = (midAngle: number, halfSpan: number, innerRadius: number, outerRadius: number) => ({
    startAngle: midAngle - halfSpan,
    endAngle: midAngle + halfSpan,
    innerRadius,
    outerRadius,
});
const anchorAt = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

describe('fitSectorLabelRect', () => {
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

    it('leaves a measured block on the anchor when the wedge holds it there', () => {
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14, { width: 20, height: 14 });
        expect(rect).toMatchObject({ centerX: anchor.x, centerY: anchor.y, anchored: true });
    });

    it('leaves a measured block on the anchor when it fits the wedge there but not the arc clearance', () => {
        const s = { startAngle: 3.10365, endAngle: 3.31613, innerRadius: 133.38, outerRadius: 177.84 };
        const anchor = { x: -155.247, y: -10.619 };
        const block = { width: 42.68, height: 13.8 };
        const box = { x: anchor.x - block.width / 2, y: anchor.y - block.height / 2, ...block };
        const inset = { ...s, innerRadius: s.innerRadius + 0.75, outerRadius: s.outerRadius - 0.75 };
        expect([isBoxInSector(box, s), isBoxInSector(box, inset)]).toEqual([true, false]);
        const rect = fitSectorLabelRect(anchor, s, block.height, block);
        expect(rect).toMatchObject({ centerX: anchor.x, centerY: anchor.y, anchored: true });
    });

    it('moves a measured block off the anchor only when the wedge cannot hold it there', () => {
        const s = sector(-Math.PI / 3, Math.PI / 8, 40, 120);
        const anchor = anchorAt(85, -Math.PI / 3);
        const rect = fitSectorLabelRect(anchor, s, 14, { width: 70, height: 42 });
        expect(rect.anchored).toBeUndefined();
        expect(Math.hypot(rect.centerX - anchor.x, rect.centerY - anchor.y)).toBeGreaterThan(1);
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

describe('sectorLabelRoom', () => {
    const s = sector(0, Math.PI / 6, 40, 160);
    const anchor = anchorAt(100, 0);

    it('admits a block the wedge does hold, since a bound that refused one would drop a fitting label', () => {
        const block = { width: 60, height: 28 };
        expect(fitSectorLabelRect(anchor, s, 14, block).anchored).toBe(true);
        const room = sectorLabelRoom(anchor, s, 14);
        expect(room.capacityAt(14)).toBeGreaterThanOrEqual(block.width);
        expect(room.area).toBeGreaterThanOrEqual(block.width * block.height);
    });

    it('holds fewer lines, and so less text, as the lines grow taller', () => {
        const room = sectorLabelRoom(anchor, s, 14);
        expect(room.capacityAt(28)).toBeLessThan(room.capacityAt(14));
    });
});

describe('sectorLabelPlacer', () => {
    const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
    const image = (size: number) => ({
        type: 'image' as const,
        url: 'https://example.com/logo.png',
        width: size,
        height: size,
    });
    const place = (
        text: NormalisedTextOrSegments,
        s: ReturnType<typeof sector>,
        anchor: { x: number; y: number },
        minimumFontSize?: number
    ) =>
        sectorLabelPlacer(
            anchor,
            s,
            NO_PADDING,
            {},
            0,
            0
        )({
            text,
            policy: { overflowStrategy: 'ellipsis', minimumFontSize },
            font: { fontSize: 12, fontFamily: 'sans-serif' },
        });

    it.each<[string, NormalisedTextOrSegments]>([
        ['plain text', 'Alpha'],
        ['multi-line text', 'Alpha\nBravo'],
        ['text segments', [{ text: 'Alpha' }, { text: 'Bravo' }]],
        ['an image only', [image(16)]],
        ['an image and text', [image(16), { text: 'Alpha' }]],
    ])('places %s whole and at full size in a roomy wedge', (_, text) => {
        const content = Array.isArray(text) ? text.map((segment) => expect.objectContaining(segment)) : text;
        const wedge = sector(Math.PI / 2, Math.PI / 3, 0, 300);
        const placed = place(text, wedge, anchorAt(150, Math.PI / 2), 6);
        expect(placed).toEqual({ text: content, x: expect.any(Number), y: expect.any(Number), fontSize: undefined });
        expect(isPointInSector(placed?.x ?? Number.NaN, placed?.y ?? Number.NaN, wedge)).toBe(true);
    });

    it.each([undefined, 6])(
        'keeps an image-only label on its anchor in a wedge only just deep enough (minimumFontSize %s)',
        (minimumFontSize) => {
            const anchor = anchorAt(122, Math.PI / 3);
            const placed = place([image(16)], sector(Math.PI / 3, Math.PI / 8, 100, 144), anchor, minimumFontSize);
            expect(placed?.text).toEqual([expect.objectContaining(image(16))]);
            expect(placed?.x).toBeCloseTo(anchor.x);
            expect(placed?.y).toBeCloseTo(anchor.y);
        }
    );

    it('places nothing when the wedge cannot hold an image-only label', () => {
        expect(
            place([image(40)], sector(Math.PI / 2, Math.PI / 16, 100, 120), anchorAt(110, Math.PI / 2))
        ).toBeUndefined();
    });
});
