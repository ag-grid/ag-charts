import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { Text, type TextBoxingProperties } from '../scene/shape/text';
import { areLineBoxesInSector, isBoxInSector, isPointInSector } from '../scene/util/sector';
import { seedRandom } from '../test/random';
import { stubPath2D } from '../test/stubPath2D';
import { type OverflowStrategy, fontWithSize } from '../text/textWrapper';
import type { FontOptions } from '../types/text';
import { fitSectorLabelRect, sectorLabelPlacer, sectorLabelRoom } from './sectorLabelFit';

vi.mock('../rendering/canvasUtil', async (importOriginal) =>
    (await import('../test/fixedWidthCanvas')).fixedWidthCanvasUtil(importOriginal)
);

beforeAll(stubPath2D);

const sector = (midAngle: number, halfSpan: number, innerRadius: number, outerRadius: number) => ({
    startAngle: midAngle - halfSpan,
    endAngle: midAngle + halfSpan,
    innerRadius,
    outerRadius,
});
const anchorAt = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

interface HangCase {
    mid: number;
    halfSpan: number;
    inner: number;
    outer: number;
    radius: number;
    x: number;
    y: number;
    min?: number;
}

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
    afterEach(() => {
        vi.restoreAllMocks();
    });

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

        it.each([
            { text: 'Alpha', mid: Math.PI / 2, halfSpan: Math.PI / 3, inner: 0, outer: 300, radius: 150, pad: 0 },
            { text: 'Alpha', mid: Math.PI / 2, halfSpan: Math.PI / 3, inner: 0, outer: 300, radius: 150, pad: 6 },
            { text: 'Alpha Bravo', mid: 0.4, halfSpan: 0.5, inner: 60, outer: 200, radius: 130, pad: 2 },
            { text: 'Revenue', mid: -2.1, halfSpan: 0.35, inner: 80, outer: 260, radius: 200, pad: 4 },
            { text: 'Delta', mid: 2.8, halfSpan: 0.25, inner: 100, outer: 300, radius: 200, pad: 0 },
        ])(
            'keeps $text on its anchor exactly where the full fit places it (padding $pad)',
            ({ text, mid, halfSpan, inner, outer, radius, pad }) => {
                const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
                const padding = { top: pad, right: pad, bottom: pad, left: pad };
                const fitWith = (maxWidth?: number) =>
                    sectorLabelPlacer(
                        anchorAt(radius, mid),
                        sector(mid, halfSpan, inner, outer),
                        padding,
                        {},
                        0,
                        0
                    )({ text, policy: { maxWidth }, font: { fontSize: 12, fontFamily: 'sans-serif' } });
                const onAnchor = fitWith();
                expect(layouts).toHaveBeenCalledTimes(1);
                // A width bound turns the anchor shortcut off without bounding a line the wedge holds.
                expect(fitWith(Infinity)).toEqual(onAnchor);
            }
        );
    });

    describe('a label whose box meets the outer rim', () => {
        const font = { fontSize: 12, fontFamily: 'sans-serif' };
        // Lays the label out as the series' own node draws it, for the visibility gate.
        const drawnBoxes = (text: NormalisedTextOrSegments, x: number, y: number) => {
            const node = new Text();
            node.setAlign({ textAlign: 'center', textBaseline: 'middle' });
            node.setBoxing({});
            node.text = text;
            node.x = x;
            node.y = y;
            node.setFont(font);
            return node.getLineBoxes();
        };
        // The radius `steps` representable doubles away from a positive `radius`.
        const ulpsFrom = (radius: number, steps: number) => {
            const bits = new BigInt64Array(new Float64Array([radius]).buffer);
            bits[0] += BigInt(steps);
            return new Float64Array(bits.buffer)[0];
        };

        it.each([0, 4])('is shown wherever its anchor holds it, to the ulp (padding %s)', (pad) => {
            const padding = { top: pad, right: pad, bottom: pad, left: pad };
            let heldOnRim = 0;
            for (let i = 0; i < 24; i += 1) {
                const mid = (i * Math.PI) / 12;
                const anchor = anchorAt(100, mid);
                const [box] = drawnBoxes('Alpha', anchor.x, anchor.y);
                const x0 = box.x - pad;
                const y0 = box.y - pad;
                const x1 = x0 + (box.width + 2 * pad);
                const y1 = y0 + (box.height + 2 * pad);
                const rim = Math.max(
                    ...[x0, x1].flatMap((x) => [y0, y1].map((y) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))))
                );
                for (let step = -2; step <= 2; step += 1) {
                    const wedge = sector(mid, 1.2, 0, ulpsFrom(rim, step));
                    const placed = sectorLabelPlacer(
                        anchor,
                        wedge,
                        padding,
                        {},
                        0,
                        0
                    )({ text: 'Alpha', policy: {}, font });
                    if (placed?.x !== anchor.x || placed.y !== anchor.y) continue;
                    if (step === 0) heldOnRim += 1;
                    expect(areLineBoxesInSector(drawnBoxes(placed.text, placed.x, placed.y), wedge)).toBe(true);
                }
            }
            expect(heldOnRim).toBeGreaterThan(0);
        });
    });

    const hangText = 'Category 123 label';
    const hangFont = { fontSize: 12, fontFamily: 'sans-serif' };
    const placeHanging = ({ mid, halfSpan, inner, outer, radius, min }: HangCase, drawnAsFitted: boolean) =>
        sectorLabelPlacer(
            anchorAt(radius, mid),
            sector(mid, halfSpan, inner, outer),
            NO_PADDING,
            {},
            0,
            0,
            drawnAsFitted
        )({ text: hangText, policy: { minimumFontSize: min }, font: hangFont });

    // `x` and `y` are where the overflow passes hang each label, a place the gate hides it at in its own style.
    const linelessWedges: HangCase[] = [
        { mid: 0, halfSpan: 0.005, inner: 0, outer: 250, radius: 125, x: 125, y: 10 },
        { mid: 1, halfSpan: 0.005, inner: 0, outer: 250, radius: 125, x: 67.53778823351747, y: 115.18387310098706 },
        {
            mid: 2.6,
            halfSpan: 0.01,
            inner: 125,
            outer: 250,
            radius: 187.5,
            x: -160.66664125667762,
            y: 106.65650721652453,
        },
        {
            mid: 0.3,
            halfSpan: 0.01,
            inner: 0,
            outer: 250,
            radius: 125,
            x: 119.41706114070075,
            y: 46.940025832667445,
            min: 8,
        },
    ];

    it.each(linelessWedges)(
        'places nothing, without laying it out, for a label drawn as fitted that the wedge at mid $mid holds no line of',
        (c) => {
            const node = new Text();
            node.setAlign({ textAlign: 'center', textBaseline: 'middle' });
            node.setBoxing({});
            node.text = hangText;
            node.x = c.x;
            node.y = c.y;
            node.setFont(hangFont);
            expect(areLineBoxesInSector(node.getLineBoxes(), sector(c.mid, c.halfSpan, c.inner, c.outer))).toBe(false);

            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            expect(placeHanging(c, true)).toBeUndefined();
            expect(layouts).not.toHaveBeenCalled();
        }
    );

    // A state-dependent style can draw the label smaller than it is fitted, so it is hung for the gate to judge.
    it.each(linelessWedges)('hangs a label a state may restyle at mid $mid where every overflow pass puts it', (c) => {
        expect(placeHanging(c, false)).toEqual({ text: hangText, x: c.x, y: c.y, fontSize: undefined });
    });

    // A wedge near vertical can hold a line, so the label is hung where every overflow pass puts it.
    it.each(
        [
            {
                mid: 1.55,
                halfSpan: 0.005,
                inner: 0,
                outer: 250,
                radius: 125,
                x: 2.5493898819035823,
                y: 125.58570627196065,
            },
            {
                mid: -1.5708,
                halfSpan: 0.02,
                inner: 0,
                outer: 250,
                radius: 125,
                x: -0.00042934831553062644,
                y: -182.4939548960836,
            },
        ].flatMap((c) => [true, false].map((drawnAsFitted) => ({ ...c, drawnAsFitted })))
    )(
        'hangs a label no wedge position holds at mid $mid where every overflow pass puts it (drawn as fitted $drawnAsFitted)',
        (c) => {
            expect(placeHanging(c, c.drawnAsFitted)).toEqual({ text: hangText, x: c.x, y: c.y, fontSize: undefined });
        }
    );

    describe('rich text in a wedge too thin for any of its lines', () => {
        const placeRich = (c: HangCase, text: NormalisedTextOrSegments, drawnAsFitted = true) =>
            sectorLabelPlacer(
                anchorAt(c.radius, c.mid),
                sector(c.mid, c.halfSpan, c.inner, c.outer),
                NO_PADDING,
                {},
                0,
                0,
                drawnAsFitted
            )({ text, policy: { minimumFontSize: c.min }, font: hangFont, boundByRegion: true });
        const mixed = [
            { text: 'Category ' },
            { text: '123', fontSize: 9, fontWeight: 'bold' as const },
            { text: ' label' },
        ];

        it.each(linelessWedges)('places nothing, without laying it out, at mid $mid', (c) => {
            expect(placeRich(c, mixed, false)).toBeDefined();
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            expect(placeRich(c, mixed)).toBeUndefined();
            expect(layouts).not.toHaveBeenCalled();
        });

        // The mocked canvas draws every font on a 20px line, so a segment's own `lineHeight` makes the short line.
        it.each(linelessWedges)('fits in full where one segment draws a line short enough, at mid $mid', (c) => {
            const short = [...mixed, { text: ' tiny', lineHeight: 0.5 }];
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            expect(placeRich(c, short)).toEqual(placeRich(c, short, false));
            expect(layouts).toHaveBeenCalled();
        });

        it.each(linelessWedges)('fits in full where it holds an image, at mid $mid', (c) => {
            const withImage = [...mixed, image(1)];
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            expect(placeRich(c, withImage)).toEqual(placeRich(c, withImage, false));
            expect(layouts).toHaveBeenCalled();
        });
    });

    // The fast path only drops placements the gate hides, so every label drawn is the one the full fit draws.
    it('shows every label the full fit shows, placed the same, across random wedges and rich text', () => {
        const random = seedRandom(18765);
        const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];
        const words = ['Alpha', 'Bravo 12', ' ', 'x', 'Category 123 label', 'One\nTwo', ''];
        const segment = () => ({
            text: pick(words),
            ...(random() < 0.4 && { fontSize: pick([4, 8, 12, 18]) }),
            ...(random() < 0.4 && { lineHeight: pick([0.5, 2, 6, 14, 30]) }),
            ...(random() < 0.3 && { fontWeight: 'bold' as const }),
            ...(random() < 0.2 && { minimumFontSize: pick([2, 6]) }),
        });
        const drawnBoxes = (
            placed: { text: NormalisedTextOrSegments; x: number; y: number; fontSize?: number },
            font: FontOptions,
            boxing: TextBoxingProperties
        ) => {
            const node = new Text();
            node.setAlign({ textAlign: 'center', textBaseline: 'middle' });
            node.setBoxing(boxing);
            node.text = placed.text;
            node.x = placed.x;
            node.y = placed.y;
            node.setFont(fontWithSize(font, placed.fontSize));
            return node.getLineBoxes();
        };
        let fastPath = 0;
        let hiddenByGate = 0;
        for (let i = 0; i < 1500; i += 1) {
            const mid = random() * 2 * Math.PI;
            const halfSpan = random() < 0.8 ? 0.0005 + random() * 0.03 : random() * 0.4;
            const outer = 60 + random() * 260;
            const inner = random() < 0.5 ? 0 : outer * random() * 0.9;
            const wedge = sector(mid, halfSpan, inner, outer);
            const anchor = anchorAt(inner + (outer - inner) * (0.2 + random() * 0.7), mid);
            const text: NormalisedTextOrSegments =
                random() < 0.15 ? pick(words) : Array.from({ length: 1 + Math.floor(random() * 3) }, segment);
            const font: FontOptions = {
                fontSize: pick([6, 12, 16]),
                fontFamily: 'sans-serif',
                ...(random() < 0.3 && { lineHeight: pick([3, 12, 24]) }),
            };
            const pad = random() < 0.5 ? 0 : pick([-6, -2, 3]);
            const extent = Math.max(0, pad);
            const padding = { top: extent, right: extent, bottom: extent, left: extent };
            const boxing: TextBoxingProperties = random() < 0.4 ? { fill: 'red', padding: pad } : {};
            const fit = {
                text,
                policy: {
                    overflowStrategy: pick([undefined, 'ellipsis', 'hide'] as const),
                    wrapping: pick([undefined, 'never', 'always', 'on-space'] as const),
                    minimumFontSize: pick([undefined, undefined, 4, 8]),
                },
                font,
                boundByRegion: true,
            };
            const place = (drawnAsFitted: boolean) =>
                sectorLabelPlacer(anchor, wedge, padding, boxing, 0, 0, drawnAsFitted)(fit);
            const layouts = vi.spyOn(Text.prototype, 'getLineBoxes');
            const fast = place(true);
            const fastLayouts = layouts.mock.calls.length;
            const full = place(false);
            const rich = Array.isArray(text);
            if (rich && fastLayouts === 0 && layouts.mock.calls.length > 0) fastPath += 1;
            layouts.mockRestore();
            if (fast == null && full != null) {
                if (rich) hiddenByGate += 1;
                expect(areLineBoxesInSector(drawnBoxes(full, font, boxing), wedge)).toBe(false);
            } else {
                expect(fast).toEqual(full);
            }
        }
        expect(fastPath).toBeGreaterThan(100);
        expect(hiddenByGate).toBeGreaterThan(100);
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

    // Synchronous, so no suspended async frame keeps the placed text alive across the await below.
    function placeTracked(refs: WeakRef<object>[]) {
        const text = [{ text: 'Alpha Bravo Charlie' }, image(16)];
        refs.push(new WeakRef(text));
        const placed = sectorLabelPlacer(
            anchorAt(100, Math.PI / 2),
            sector(Math.PI / 2, Math.PI / 8, 0, 200),
            NO_PADDING,
            {},
            0,
            0
        )({ text, policy: {}, font: { fontSize: 12, fontFamily: 'sans-serif' } });
        if (typeof placed?.text === 'object') refs.push(new WeakRef(placed.text));
        return refs.length;
    }

    it('keeps no reference to the label it placed once it returns', async () => {
        const { gc } = globalThis;
        if (gc == null) throw new Error('Run with --expose-gc');
        const refs: WeakRef<object>[] = [];
        expect(placeTracked(refs)).toBe(2);
        // A WeakRef keeps its target alive until the job that created it ends.
        await new Promise((resolve) => setTimeout(resolve, 0));
        gc();
        expect(refs.filter((ref) => ref.deref() != null)).toHaveLength(0);
    });
});
