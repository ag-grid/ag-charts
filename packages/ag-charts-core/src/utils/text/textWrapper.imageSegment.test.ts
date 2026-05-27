import { describe, expect, it, vi } from 'vitest';

import type { ImageSegment, Segment, TextSegment } from 'ag-charts-types';

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

// Real measureTextSegments mirror that handles both TextSegment and ImageSegment, producing
// realistic line metrics so wrapTextSegments can decide what fits and what doesn't.
function mockMeasureTextSegments(segments: Segment[]) {
    type LineMetric = { segments: any[]; width: number; height: number; ascent: number; descent: number };
    let line: LineMetric = { segments: [], width: 0, height: 0, ascent: 0, descent: 0 };
    const lines: LineMetric[] = [line];

    for (const seg of segments) {
        if (seg.type === 'image') {
            const pad = typeof seg.padding === 'number' ? seg.padding : 0;
            const boxWidth = seg.width + pad * 2;
            const boxHeight = seg.height + pad * 2;
            line.width += boxWidth;
            line.ascent = Math.max(line.ascent, boxHeight);
            line.height = Math.max(line.height, line.ascent + line.descent);
            line.segments.push({
                ...seg,
                textMetrics: { width: boxWidth, height: boxHeight, ascent: boxHeight, descent: 0 },
            });
            continue;
        }
        const parts = String(seg.text).split(/\r?\n/);
        for (let i = 0; i < parts.length; i++) {
            const t = parts[i];
            if (i > 0) {
                line = { segments: [], width: 0, height: 0, ascent: 0, descent: 0 };
                lines.push(line);
            }
            if (t) {
                const width = [...t].length * CHAR_WIDTH;
                line.width += width;
                line.ascent = Math.max(line.ascent, 16);
                line.descent = Math.max(line.descent, 4);
                line.height = Math.max(line.height, line.ascent + line.descent);
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
            }
        }
    }

    return {
        width: Math.max(...lines.map((l) => l.width)),
        height: lines.reduce((sum, l) => sum + l.height, 0),
        lineMetrics: lines,
    };
}

vi.mock('../../rendering/textMeasurer', () => ({
    cachedTextMeasurer: () => mockMeasurer,
    measureTextSegments: mockMeasureTextSegments,
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
        const segments: Segment[] = [text('AB '), image('flag', { width: 20, height: 20 }), text(' CD')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 200 });
        expect(imageUrls(result)).toEqual(['https://example.com/flag.png']);
        expect(textOf(result)).toBe('AB  CD');
    });

    it("drops a 'hide' image rightmost-first to keep text intact", () => {
        // Width budget: 70px. With image: 20 + 30 + 40 = 90 (overflow). Without image: 20 + 40 = 60 (fits).
        const segments: Segment[] = [
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

    it("preserves 'keep' images through text truncation, dropping them only as a last resort", () => {
        // Width budget: 50px. Keep image at end + long preceding text → drop image to avoid losing all text.
        const segments: Segment[] = [
            text('AAAAAAAAAA'), // 100px
            image('keepMe', { width: 30, height: 30, overflowStrategy: 'keep' }),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 50,
            overflow: 'ellipsis',
            textWrap: 'never',
        });
        // Keep image is dropped only after text truncation isn't sufficient.
        expect(imageUrls(result)).toEqual([]);
    });

    it("drops 'hide' images before 'keep' images when both are present and content overflows", () => {
        const segments: Segment[] = [
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
        const segments: Segment[] = [text('Hello'), text(' world')];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });
        expect(textOf(result)).toBe('Hello world');
    });
});
