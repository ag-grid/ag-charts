import { describe, expect, it, vi } from 'vitest';

import type { ContentSegment, ImageSegment, TextSegment } from 'ag-charts-types';

import type { ITextMeasurer, MeasuredSegment } from '../../types/text';

// Fixed-width measurer used by both cachedTextMeasurer and a hand-rolled measureTextSegments mock
// that mirrors the real implementation's line-metric shape.
const CHAR_WIDTH = 10;
const LINE_HEIGHT = 20;

const mockMeasurer: ITextMeasurer = {
    textWidth: (text: string) => [...text].length * CHAR_WIDTH,
    measureText: (text: string) => ({
        width: [...text].length * CHAR_WIDTH,
        height: LINE_HEIGHT,
        ascent: 16,
        descent: 4,
    }),
    measureLines: (input: string | string[]) => {
        const lines = typeof input === 'string' ? input.split(/\r?\n/) : input;
        const lineMetrics = lines.map((line) => ({
            text: line,
            width: [...line].length * CHAR_WIDTH,
            height: LINE_HEIGHT,
            ascent: 16,
            descent: 4,
        }));
        return {
            width: Math.max(...lineMetrics.map((l) => l.width)),
            height: lineMetrics.length * LINE_HEIGHT,
            lineMetrics,
        };
    },
    baselineDistance: () => 0,
    lineHeight: () => LINE_HEIGHT,
};

const BLOCK_IMAGE_SPACING = 4;

const mockImageSegmentBox = (segment: ImageSegment) => {
    const pad = typeof segment.padding === 'number' ? segment.padding : 0;
    const width = segment.width + pad * 2;
    const height = segment.height + pad * 2;
    return { width, height, ascent: height, descent: 0 };
};

// Mirrors `isBlockBoundary` in textMeasurer.ts.
function mockIsBlockBoundary(segments: ContentSegment[], i: number): boolean {
    const seg = segments[i];
    if (seg?.type !== 'image' || seg.block !== true) return false;
    if (i === 0) return true;
    const prev = segments[i - 1];
    if (prev.type === 'image') return prev.block === true;
    return String(prev.text).endsWith('\n');
}

// Real measureTextSegments mirror that handles both TextSegment and ImageSegment, producing
// realistic line metrics (including per-line block markers) so wrapTextSegments can decide
// what fits and what doesn't.
function mockMeasureTextSegments(segments: ContentSegment[]) {
    type LineMetric = {
        segments: any[];
        width: number;
        height: number;
        ascent: number;
        descent: number;
        blockImages?: any[];
        blockRowSpan?: number;
    };
    const emptyLine = (): LineMetric => ({ segments: [], width: 0, height: 0, ascent: 0, descent: 0 });
    let line: LineMetric = emptyLine();
    const lines: LineMetric[] = [line];
    let uncommitted = false;
    let blockStart: number | null = null;

    function finalizeBlock() {
        if (blockStart === null) return;
        let endIndex = lines.length;
        if (uncommitted && endIndex > blockStart + 1) endIndex -= 1;
        lines[blockStart].blockRowSpan = endIndex - blockStart;
        blockStart = null;
    }

    function openNewLine() {
        line = emptyLine();
        lines.push(line);
        uncommitted = true;
    }

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];

        if (mockIsBlockBoundary(segments, i)) {
            const extendsStrip =
                i > 0 && segments[i - 1].type === 'image' && (segments[i - 1] as ImageSegment).block === true;
            if (!extendsStrip) {
                finalizeBlock();
                if (line.segments.length > 0 || line.blockImages) openNewLine();
            }
            const box = mockImageSegmentBox(seg as ImageSegment);
            line.blockImages ??= [];
            line.blockImages.push({ ...(seg as ImageSegment), textMetrics: box });
            if (!extendsStrip) {
                blockStart = lines.length - 1;
            }
            uncommitted = false;
            continue;
        }

        if (seg.type === 'image') {
            const box = mockImageSegmentBox(seg);
            line.width += box.width;
            line.ascent = Math.max(line.ascent, box.height);
            line.height = Math.max(line.height, line.ascent + line.descent);
            line.segments.push({ ...seg, textMetrics: { ...box } });
            uncommitted = false;
            continue;
        }

        const parts = String(seg.text).split(/\r?\n/);
        for (let j = 0; j < parts.length; j++) {
            const t = parts[j];
            if (j > 0) openNewLine();
            if (t) {
                const width = [...t].length * CHAR_WIDTH;
                line.width += width;
                line.ascent = Math.max(line.ascent, 16);
                line.descent = Math.max(line.descent, 4);
                line.height = Math.max(line.height, line.ascent + line.descent);
                if (typeof seg.lineHeight === 'number' && seg.lineHeight > line.height) {
                    line.descent = seg.lineHeight - line.ascent;
                    line.height = seg.lineHeight;
                }
                line.segments.push({
                    text: t,
                    fontSize: seg.fontSize ?? 14,
                    fontFamily: seg.fontFamily,
                    fontWeight: seg.fontWeight,
                    fontStyle: seg.fontStyle,
                    color: seg.color,
                    verticalAlign: seg.verticalAlign,
                    textMetrics: { width, height: LINE_HEIGHT, ascent: 16, descent: 4 },
                });
                uncommitted = false;
            }
        }
    }

    finalizeBlock();

    let maxWidth = 0;
    let totalHeight = 0;
    for (let i = 0; i < lines.length; ) {
        const ln = lines[i];
        if (ln.blockImages?.length) {
            const span = ln.blockRowSpan ?? 1;
            const stripWidth = ln.blockImages.reduce(
                (w: number, img: any, idx: number) => w + img.textMetrics.width + (idx > 0 ? BLOCK_IMAGE_SPACING : 0),
                0
            );
            const stripHeight = ln.blockImages.reduce((h: number, img: any) => Math.max(h, img.textMetrics.height), 0);
            let innerColWidth = 0;
            let innerColHeight = 0;
            for (let k = 0; k < span; k++) {
                innerColWidth = Math.max(innerColWidth, lines[i + k].width);
                innerColHeight += lines[i + k].height;
            }
            const rowWidth = stripWidth + (innerColWidth > 0 ? BLOCK_IMAGE_SPACING + innerColWidth : 0);
            maxWidth = Math.max(maxWidth, rowWidth);
            totalHeight += Math.max(stripHeight, innerColHeight);
            i += span;
        } else {
            maxWidth = Math.max(maxWidth, ln.width);
            totalHeight += ln.height;
            i += 1;
        }
    }

    return { width: maxWidth, height: totalHeight, lineMetrics: lines };
}

function mockBlockStripWidth(images: { textMetrics: { width: number } }[]): number {
    if (images.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < images.length; i++) {
        total += images[i].textMetrics.width;
        if (i > 0) total += BLOCK_IMAGE_SPACING;
    }
    return total;
}

function mockBlockStripHeight(images: { textMetrics: { height: number } }[]): number {
    let max = 0;
    for (const img of images) max = Math.max(max, img.textMetrics.height);
    return max;
}

vi.mock('../../rendering/textMeasurer', () => ({
    cachedTextMeasurer: () => mockMeasurer,
    measureTextSegments: mockMeasureTextSegments,
    imageSegmentBox: mockImageSegmentBox,
    isBlockBoundary: mockIsBlockBoundary,
    BLOCK_IMAGE_SPACING,
    blockStripWidth: mockBlockStripWidth,
    blockStripHeight: mockBlockStripHeight,
}));

// Import after the mock so the function picks up the stubbed measureTextSegments.
const { wrapTextSegments } = await import('./textWrapper');

const text = (t: string, extra?: Partial<TextSegment>): TextSegment => ({ text: t, ...extra });
const image = (label: string, extra?: Partial<ImageSegment>): ImageSegment => ({
    type: 'image',
    url: `https://example.com/${label}.png`,
    width: 30,
    height: 30,
    ...extra,
});

const baseFont = { fontSize: 14, fontFamily: 'Verdana' } as const;

function imageUrls(result: MeasuredSegment[]): string[] {
    return result.filter((s): s is MeasuredSegment & { type: 'image' } => s.type === 'image').map((s) => s.url);
}

function textOf(result: MeasuredSegment[]): string {
    return result
        .filter((s) => s.type !== 'image')
        .map((s) => (s as { text: string }).text)
        .join('');
}

describe('wrapTextSegments — image segment overflow', () => {
    it('keeps everything when content fits', () => {
        const segments: ContentSegment[] = [text('AB '), image('flag', { width: 20, height: 20 }), text(' CD')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 200 });
        expect(imageUrls(result)).toEqual(['https://example.com/flag.png']);
        expect(textOf(result)).toBe('AB  CD');
    });

    it("drops a 'hide' image rightmost-first to keep text intact", () => {
        // Width budget: 70px. With image: 20 + 30 + 40 = 90 (overflow). Without image: 20 + 40 = 60 (fits).
        const segments: ContentSegment[] = [
            text('AB'),
            image('hideMe', { width: 30, height: 30, overflowStrategy: 'hide' }),
            text(' XYZ'),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 70,
            overflow: 'ellipsis',
            textWrap: 'never',
        });
        // The 'hide' image is dropped first so the full text fits without truncation.
        expect(imageUrls(result)).toEqual([]);
        expect(textOf(result)).not.toMatch(/…/);
        expect(textOf(result)).toBe('AB XYZ');
    });

    it("preserves a 'keep' image by dropping trailing text rather than truncating", () => {
        // Width budget: 50px. Keep image (30px) fits alone; the long preceding text would force
        // truncation if kept, so the wrapper drops the text instead and the image survives.
        const segments: ContentSegment[] = [
            text('AAAAAAAAAA'), // 100px
            image('keepMe', { width: 30, height: 30, overflowStrategy: 'keep' }),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 50,
            overflow: 'ellipsis',
            textWrap: 'never',
        });
        expect(imageUrls(result)).toEqual(['https://example.com/keepMe.png']);
        expect(textOf(result)).not.toMatch(/…/);
    });

    it("drops a 'keep' image when the image alone exceeds the width budget", () => {
        // Image is 200px wide; maxWidth is 100. No matter what gets dropped the image cannot fit,
        // so the keep flag yields and the surrounding text takes the full width.
        const segments: ContentSegment[] = [
            image('huge', { width: 200, height: 30, overflowStrategy: 'keep' }),
            text('ABC'),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 100,
            overflow: 'ellipsis',
            textWrap: 'never',
        });
        expect(imageUrls(result)).toEqual([]);
        expect(textOf(result)).toBe('ABC');
    });

    it("drops 'hide' images before 'keep' images when both are present and content overflows", () => {
        const segments: ContentSegment[] = [
            text('A'),
            image('hide1', { width: 30, height: 30, overflowStrategy: 'hide' }),
            text('B'),
            image('keep1', { width: 30, height: 30, overflowStrategy: 'keep' }),
            text('C'),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 60,
            overflow: 'ellipsis',
            textWrap: 'never',
        });
        const urls = imageUrls(result);
        // 'hide' image must be gone; 'keep' image stays unless we have no other choice.
        expect(urls).not.toContain('https://example.com/hide1.png');
    });

    it('returns content unchanged when no images present (fast path)', () => {
        const segments: ContentSegment[] = [text('Hello'), text(' world')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });
        expect(textOf(result)).toBe('Hello world');
    });

    it('preserves \\n in trailing text segment so the layout wraps to a new line', () => {
        const segments: ContentSegment[] = [image('logo', { width: 28, height: 28 }), text(' Apple'), text('\n$2900B')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        // Newline is encoded as a trailing \n on the preceding text segment.
        const joined = result.map((s) => (s.type === 'image' ? '[img]' : s.text)).join('');
        expect(joined).toBe('[img] Apple\n$2900B');

        // Sanity check: re-measuring the wrap output sees two lines.
        const remeasured = mockMeasureTextSegments(result);
        expect(remeasured.lineMetrics).toHaveLength(2);
        expect(remeasured.lineMetrics[0].segments).toHaveLength(2);
        expect(remeasured.lineMetrics[1].segments).toHaveLength(1);
    });

    it('preserves \\n when previous line ended with an image via a synthetic newline segment', () => {
        const segments: ContentSegment[] = [
            text('Title'),
            image('badge', { width: 20, height: 20 }),
            text('\nSubtitle'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        // Synthetic newline-only text segment is inserted so the renderer creates a new line.
        const remeasured = mockMeasureTextSegments(result);
        expect(remeasured.lineMetrics).toHaveLength(2);
        expect(remeasured.lineMetrics[1].segments).toHaveLength(1);
        expect(remeasured.lineMetrics[1].segments[0].text).toBe('Subtitle');
    });
});

describe('wrapTextSegments — block-leading image', () => {
    it('keeps a block image at the front and wraps subsequent segments unchanged when there is room', () => {
        const segments: ContentSegment[] = [
            image('logo', { width: 36, height: 36, block: true }),
            text('Apple', { fontWeight: 'bold' }),
            text('\n$2900B'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        expect(result[0].type).toBe('image');
        expect((result[0] as MeasuredSegment & { type: 'image' }).block).toBe(true);
        // The trailing text segments are preserved and the newline survives.
        expect(textOf(result)).toBe('Apple\n$2900B');
    });

    it('reduces the wrap width by the block image width + spacing', () => {
        // maxWidth = 100. Image width = 30 → text column has 100 - 30 - 4 = 66px available.
        // 'AB CD EF' (8 chars × 10px = 80px) doesn't fit on one line within the column → wraps.
        const segments: ContentSegment[] = [image('logo', { width: 30, height: 30, block: true }), text('AB CD EF')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 100 });

        // Text wraps into multiple lines within the reduced column.
        const textPart = result
            .filter((s) => s.type !== 'image')
            .map((s) => (s as { text: string }).text)
            .join('');
        expect(textPart).toContain('\n');
    });

    it("drops an oversized block image under 'hide' (default) and renders the remaining text alone", () => {
        // Image width = 200 exceeds maxWidth = 100 → with default 'hide', drop the image and
        // wrap the text segment through the inline path.
        const segments: ContentSegment[] = [image('huge', { width: 200, height: 50, block: true }), text('label')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 100 });

        expect(imageUrls(result)).toEqual([]);
        expect(textOf(result)).toBe('label');
    });

    it("drops an oversized block image under 'keep' too — the image cannot fit on its own", () => {
        // Even under 'keep' an image that exceeds the label box on its own cannot be preserved;
        // the wrapper drops it and renders the text at full width.
        const segments: ContentSegment[] = [
            image('huge', { width: 200, height: 50, block: true, overflowStrategy: 'keep' }),
            text('label'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 100 });

        expect(imageUrls(result)).toEqual([]);
        expect(textOf(result)).toBe('label');
    });

    it('honours a per-segment lineHeight when computing total wrap height', () => {
        // Without lineHeight, two LINE_HEIGHT-tall lines (20px each) fit inside maxHeight = 50.
        const naturalFit = wrapTextSegments([text('Foo'), text('\nBar')], {
            font: baseFont,
            maxWidth: 200,
            maxHeight: 50,
        });
        expect(textOf(naturalFit)).toBe('Foo\nBar');

        // With lineHeight: 40 on the first segment, the first line consumes 40px so the second
        // line no longer fits in the 50px budget and gets dropped/truncated.
        const overrideFit = wrapTextSegments([text('Foo', { lineHeight: 40 }), text('\nBar')], {
            font: baseFont,
            maxWidth: 200,
            maxHeight: 50,
            overflow: 'ellipsis',
        });
        expect(textOf(overrideFit)).not.toContain('Bar');
    });

    it('treats block:true mid-line (no preceding \\n) as inline', () => {
        // Block boundary requires the image to be at index 0 or the preceding text to end with \n.
        const segments: ContentSegment[] = [
            text('Prefix '),
            image('inline', { width: 20, height: 20, block: true }),
            text(' suffix'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });
        expect(result[0].type).not.toBe('image');
        expect(textOf(result)).toBe('Prefix  suffix');
    });

    it('opens a new block row when block:true follows a \\n line break', () => {
        const segments: ContentSegment[] = [
            image('logo1', { width: 30, height: 30, block: true }),
            text('Foo\n'),
            image('logo2', { width: 30, height: 30, block: true }),
            text('Bar'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        // Both block images survive and their text columns ('Foo', 'Bar') sit between them.
        expect(imageUrls(result)).toEqual(['https://example.com/logo1.png', 'https://example.com/logo2.png']);
        expect(textOf(result)).toBe('Foo\nBar');

        // Re-measure to confirm the structure: two block rows, one text line each.
        const remeasured = mockMeasureTextSegments(result);
        const markers = remeasured.lineMetrics.filter((l) => l.blockImages?.length);
        expect(markers).toHaveLength(2);
        expect(markers[0].blockRowSpan).toBe(1);
        expect(markers[1].blockRowSpan).toBe(1);
    });

    it('stacks a leading inline group above subsequent block rows', () => {
        // First segment is non-block text ending with \n → leading inline group; the block image
        // that follows opens a new row beneath it.
        const segments: ContentSegment[] = [
            text('Header\n'),
            image('logo', { width: 30, height: 30, block: true }),
            text('Body'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        const remeasured = mockMeasureTextSegments(result);
        // Two rows: line 0 'Header' (no block marker), line 1 block-image + 'Body'.
        expect(remeasured.lineMetrics).toHaveLength(2);
        expect(remeasured.lineMetrics[0].blockImages).toBeUndefined();
        expect(remeasured.lineMetrics[1].blockImages).toBeDefined();
    });
});

// Regression coverage for the AG-15933 follow-up that removed the speculative
// `textWrap: 'never'` override on axis-tick labels containing image segments.
// The wrapper must honour the user-supplied wrap mode (or theme default) when the
// label mixes text and image segments.
describe('wrapTextSegments — non-never wrap modes with image segments', () => {
    it("wraps trailing text to a new line under 'on-space' when image + text overflow the first line", () => {
        // maxWidth 60. Image is 30px → fits on line 1. Trailing 'AB CD EF' is 80px and cannot
        // fit on the same line; 'on-space' must wrap it to a new line within the budget.
        const segments: ContentSegment[] = [image('icon', { width: 30, height: 30 }), text(' AB CD EF')];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 60,
            textWrap: 'on-space',
        });

        expect(imageUrls(result)).toEqual(['https://example.com/icon.png']);
        // Text should still be readable across the wrap — no '…' truncation, content preserved.
        expect(textOf(result)).not.toMatch(/…/);
        expect(textOf(result).replace(/\s+/g, ' ').trim()).toBe('AB CD EF');
        // And the wrap should have introduced at least one line break in the text output.
        expect(textOf(result)).toContain('\n');
    });

    it("hyphenates long words under 'hyphenate' while preserving the inline image", () => {
        // 'longword' is 8 chars × 10px = 80px; maxWidth (after the image + space) is well below.
        // 'hyphenate' must break the word with hyphens; the image must still be present.
        const segments: ContentSegment[] = [image('icon', { width: 30, height: 30 }), text(' longword')];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 60,
            textWrap: 'hyphenate',
        });

        expect(imageUrls(result)).toEqual(['https://example.com/icon.png']);
        expect(textOf(result)).not.toMatch(/…/);
        // The 'longword' grapheme content survives the hyphenation; reconstructing without
        // hyphens recovers the original characters.
        expect(textOf(result).replace(/[\s-]/g, '')).toContain('longword');
    });

    it("breaks text at any boundary under 'always' while preserving the inline image", () => {
        const segments: ContentSegment[] = [image('icon', { width: 30, height: 30 }), text(' AAAAAAAA')];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 60,
            textWrap: 'always',
        });

        expect(imageUrls(result)).toEqual(['https://example.com/icon.png']);
        expect(textOf(result)).not.toMatch(/…/);
        // Every 'A' from the input survives — 'always' wraps but does not truncate.
        const aCount = (textOf(result).match(/A/g) ?? []).length;
        expect(aCount).toBe(8);
    });

    it("respects 'on-space' even when overflowStrategy is 'keep' and the line wraps", () => {
        // Keep image alongside text that needs to wrap: image stays put, text wraps normally.
        const segments: ContentSegment[] = [
            image('icon', { width: 30, height: 30, overflowStrategy: 'keep' }),
            text(' AB CD EF'),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 60,
            textWrap: 'on-space',
        });

        expect(imageUrls(result)).toEqual(['https://example.com/icon.png']);
        expect(textOf(result).replace(/\s+/g, ' ').trim()).toBe('AB CD EF');
    });
});
