import { afterEach, describe, expect, it, vi } from 'vitest';

import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { Text } from '../scene/shape/text';
import { isBoxInSector, isPointInSector } from '../scene/util/sector';
import type { OverflowStrategy } from '../text/textWrapper';
import { fitSectorLabelRect, sectorLabelPlacer, sectorLabelRoom } from './sectorLabelFit';

vi.mock('../rendering/canvasUtil', async (importOriginal) =>
    (await import('../test/fixedWidthCanvas')).fixedWidthCanvasUtil(importOriginal)
);

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

    it('leaves a measured block on the anchor when it passes the wedge test there but not the arc clearance', () => {
        const s = sector(Math.PI / 2, Math.PI / 4, 40, 100);
        const anchor = anchorAt(90, Math.PI / 2);
        const block = { width: 20, height: 18.2 };
        const box = { x: anchor.x - block.width / 2, y: anchor.y - block.height / 2, ...block };
        const clearOfArcs = { ...s, innerRadius: 40.75, outerRadius: 99.25 };
        expect([isBoxInSector(box, s), isBoxInSector(box, clearOfArcs)]).toEqual([true, false]);
        const rect = fitSectorLabelRect(anchor, s, 14, block);
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
        overflowStrategy: OverflowStrategy | undefined,
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
            policy: { overflowStrategy, minimumFontSize },
            font: { fontSize: 12, fontFamily: 'sans-serif' },
            boundByRegion: true,
        });

    describe.each<[string, OverflowStrategy | undefined]>([
        ['without an overflow strategy', undefined],
        ['with an ellipsis', 'ellipsis'],
    ])('%s', (_name, overflowStrategy) => {
        it.each<[string, NormalisedTextOrSegments]>([
            ['plain text', 'Alpha'],
            ['text segments', [{ text: 'Alpha' }, { text: 'Bravo' }]],
            ['an image only', [image(16)]],
            ['an image and text', [image(16), { text: 'Alpha' }]],
        ])('places %s whole and at full size in a roomy wedge', (_, text) => {
            const content = Array.isArray(text) ? text.map((segment) => expect.objectContaining(segment)) : text;
            const wedge = sector(Math.PI / 2, Math.PI / 3, 0, 300);
            const placed = place(text, wedge, anchorAt(150, Math.PI / 2), overflowStrategy, 6);
            expect(placed).toEqual({
                text: content,
                x: expect.any(Number),
                y: expect.any(Number),
                fontSize: undefined,
            });
        });

        it.each([undefined, 6])(
            'keeps an image-only label on its anchor in a wedge only just deep enough (minimumFontSize %s)',
            (minimumFontSize) => {
                const anchor = anchorAt(122, Math.PI / 3);
                const wedge = sector(Math.PI / 3, Math.PI / 8, 100, 144);
                const placed = place([image(16)], wedge, anchor, overflowStrategy, minimumFontSize);
                expect(placed?.text).toEqual([expect.objectContaining(image(16))]);
                expect(placed?.x).toBeCloseTo(anchor.x);
                expect(placed?.y).toBeCloseTo(anchor.y);
            }
        );

    });

    describe('an image-only label the wedge cannot hold', () => {
        const wedge = sector(Math.PI / 2, Math.PI / 16, 100, 120);
        const anchor = anchorAt(110, Math.PI / 2);

        it('is placed nowhere when it truncates', () => {
            expect(place([image(40)], wedge, anchor, 'ellipsis')).toBeUndefined();
        });

        it('overflows the wedge whole when it does not truncate, like text', () => {
            const placed = place([image(40)], wedge, anchor, undefined);
            expect(placed?.text).toEqual([expect.objectContaining(image(40))]);
            const box = { x: placed!.x - 20, y: placed!.y - 20, width: 40, height: 40 };
            expect(isBoxInSector(box, wedge)).toBe(false);
        });
    });

    describe('layout passes', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('lays out a label its anchor holds once, and keeps it there whole', () => {
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            const anchor = anchorAt(150, Math.PI / 2);
            const placed = place('Alpha', sector(Math.PI / 2, Math.PI / 3, 0, 300), anchor, undefined);
            expect(placed).toEqual({ text: 'Alpha', x: anchor.x, y: anchor.y, fontSize: undefined });
            expect(layouts).toHaveBeenCalledTimes(1);
        });

        it('fits a label in a wedge wider than a half turn in full, even where its anchor holds it', () => {
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            place('Alpha', sector(Math.PI / 2, (3 * Math.PI) / 4, 0, 300), anchorAt(150, Math.PI / 2), undefined);
            expect(layouts.mock.calls.length).toBeGreaterThan(1);
        });

        it.each([
            ['its anchor cannot hold', undefined],
            ['may shrink', 6],
        ])('fits a label %s to the wedge in full', (_, minimumFontSize) => {
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            const wedge = sector(Math.PI / 2, Math.PI / 10, 0, 200);
            place('Alpha Bravo', wedge, anchorAt(100, Math.PI / 2), 'ellipsis', minimumFontSize);
            expect(layouts.mock.calls.length).toBeGreaterThan(1);
        });
    });

    it('places a preserved label that fits whole where a hiding one goes, as it did before overflow', () => {
        // The first pass, against the estimated block, loses text that the re-placed pass fits whole.
        const s = sector(0.3, 0.6, 0, 80);
        const placeGolf = (overflowStrategy?: 'hide') =>
            sectorLabelPlacer(
                anchorAt(40, 0.3),
                s,
                { top: 6, bottom: 6, left: 6, right: 6 },
                {},
                0,
                0
            )({
                text: 'Golf',
                policy: { wrapping: 'always', overflowStrategy },
                font: { fontSize: 14, fontFamily: 'sans-serif' },
            });
        expect(placeGolf()?.text).toBe('Golf');
        expect(placeGolf()).toEqual(placeGolf('hide'));
    });
});
