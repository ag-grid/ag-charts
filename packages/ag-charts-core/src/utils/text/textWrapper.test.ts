import { vi } from 'vitest';

import type { ContentSegment, ImageSegment, TextSegment } from 'ag-charts-types';

import { measureTextSegments } from '../../rendering/textMeasurer';
import type { ITextMeasurer, MeasuredSegment } from '../../types/text';
import type { FitRegion } from '../geometry/fitRegion';
import { EllipsisChar } from './textUtils';
import type { FontOptions } from './textUtils';
import {
    clipLines,
    fitLabelText,
    fitLabelTextToRegion,
    truncateLine,
    wrapLines,
    wrapTextSegments,
} from './textWrapper';

// Mock only the canvas leaf so the real cachedTextMeasurer, measureTextSegments and wrapTextSegments run
// against deterministic metrics: every grapheme cluster is CHAR_WIDTH px wide, every line LINE_HEIGHT px tall.
const { CHAR_WIDTH, LINE_HEIGHT } = vi.hoisted(() => ({ CHAR_WIDTH: 10, LINE_HEIGHT: 20 }));

vi.mock('../canvas', () => ({
    // jsdom has no canvas, so cachedTextMeasurer's real createCanvasContext throws. This stand-in only needs
    // a writable `font` and a measureText returning fixed metrics.
    createCanvasContext: () => ({
        font: '',
        measureText: (text: string) => ({
            width: [...text].length * CHAR_WIDTH,
            fontBoundingBoxAscent: 16,
            fontBoundingBoxDescent: 4,
            emHeightAscent: 16,
            emHeightDescent: 4,
        }),
    }),
}));

// Fixed-width mock: each grapheme cluster costs `charWidth` pixels.
// Uses codepoint count ([...text]) so surrogate pairs count as 1 unit.
function createMockMeasurer(charWidth = 10): ITextMeasurer {
    const width = (text: string) => [...text].length * charWidth;
    return {
        textWidth: width,
        measureText(text: string) {
            return { width: width(text), height: 20, ascent: 16, descent: 4 };
        },
        measureLines(text: string | string[]) {
            const lines = typeof text === 'string' ? text.split(/\r?\n/) : text;
            const lineMetrics = lines.map((line) => ({
                text: line,
                width: width(line),
                height: 20,
                ascent: 16,
                descent: 4,
            }));
            return {
                width: Math.max(...lineMetrics.map((l) => l.width)),
                height: lineMetrics.length * 20,
                lineMetrics,
            };
        },
        baselineDistance() {
            return 0;
        },
        lineHeight() {
            return 20;
        },
    };
}

// Used by the truncateLine/clipLines suites (which take an explicit measurer) and the wrapLines
// width assertions. Identical metrics to the mocked canvas, so it agrees with the real measurer.
const mockMeasurer = createMockMeasurer(10);

// Helper: returns true if the string contains any lone UTF-16 surrogates.
function hasLoneSurrogates(str: string): boolean {
    let i = 0;
    while (i < str.length) {
        const code = str.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff) {
            // High surrogate — must be followed by a low surrogate
            const next = str.charCodeAt(i + 1);
            if (next < 0xdc00 || next > 0xdfff) return true;
            i += 2; // skip the pair
        } else if (code >= 0xdc00 && code <= 0xdfff) {
            // Lone low surrogate
            return true;
        } else {
            i += 1;
        }
    }
    return false;
}

// True when a combining mark (U+0300–U+036F) has been separated from its base character.
function hasOrphanedCombiningMark(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code >= 0x0300 && code <= 0x036f) {
            if (i === 0) return true;
            // Check if preceding char is also a combining mark (stacked orphans)
            const prev = str.charCodeAt(i - 1);
            if (prev >= 0x0300 && prev <= 0x036f) return true;
        }
    }
    return false;
}

const E = EllipsisChar; // shorthand for assertions
const ZWJ = '\u200D'; // zero-width joiner

describe('truncateLine', () => {
    const measurer = createMockMeasurer(10);

    describe('ASCII regression', () => {
        it('should return text unchanged when it fits within maxWidth', () => {
            expect(truncateLine('Hello', measurer, 100)).toBe('Hello');
        });

        it('should add ellipsis when text exceeds maxWidth', () => {
            // 'Hello World' = 11 graphemes = 110px, maxWidth = 80px
            const result = truncateLine('Hello World', measurer, 80);
            expect(result.endsWith(E)).toBe(true);
            expect(result.length).toBeLessThan('Hello World'.length);
        });

        it('should handle empty string', () => {
            expect(truncateLine('', measurer, 100)).toBe('');
        });
    });

    describe('ellipsisForce', () => {
        it('should append ellipsis when text fits and there is room', () => {
            // 'Hello' = 50px, ellipsis = 10px, maxWidth = 60px → fits with ellipsis
            expect(truncateLine('Hello', measurer, 60, true)).toBe(`Hello${E}`);
        });

        it('should truncate + ellipsis when text fits but no room for ellipsis', () => {
            // 'Hello' = 50px, ellipsis = 10px, maxWidth = 50px → no room for ellipsis
            const result = truncateLine('Hello', measurer, 50, true);
            expect(result.endsWith(E)).toBe(true);
            expect(result.length).toBeLessThan('Hello'.length + 1);
        });
    });

    describe('edge cases', () => {
        it('should return ellipsis for a single character exceeding maxWidth', () => {
            // 'X' = 10px, maxWidth = 5px → can't fit, returns ellipsis
            const result = truncateLine('X', measurer, 5);
            expect(result).toBe(E);
        });

        it('should trim trailing whitespace during truncation', () => {
            // 'Hello World' = 110px, maxWidth = 70px → fits 'Hello W' but trims to 'Hello'
            const result = truncateLine('Hello World', measurer, 70);
            expect(result).toBe(`Hello${E}`);
            expect(result).not.toContain(' ');
        });

        it('should return ellipsis when maxWidth is 0', () => {
            expect(truncateLine('Hello', measurer, 0)).toBe(E);
        });
    });

    describe('surrogate pair safety', () => {
        it('should not split emoji surrogate pairs when truncating', () => {
            const result = truncateLine('Hello 😀😀😀 World', measurer, 100);
            expect(hasLoneSurrogates(result)).toBe(false);
        });

        it('should not produce lone surrogates with very narrow maxWidth', () => {
            const result = truncateLine('😀😀😀', measurer, 25);
            expect(hasLoneSurrogates(result)).toBe(false);
        });

        it('should handle string of only emoji', () => {
            const result = truncateLine('😀😀😀😀😀', measurer, 35);
            expect(hasLoneSurrogates(result)).toBe(false);
            expect(result.endsWith(E)).toBe(true);
        });

        it('should handle flag emoji (multi-codepoint)', () => {
            const result = truncateLine('🇺🇸🇬🇧🇫🇷', measurer, 35);
            expect(hasLoneSurrogates(result)).toBe(false);
        });
    });

    describe('combining marks', () => {
        it('should not orphan combining marks when truncating', () => {
            const eAcute = 'e\u0301';
            const text = eAcute.repeat(5);
            const result = truncateLine(text, measurer, 35);
            expect(hasOrphanedCombiningMark(result)).toBe(false);
        });
    });

    describe('Arabic text', () => {
        it('should truncate Arabic text at grapheme boundaries', () => {
            const text = 'مرحبا بالعالم';
            const result = truncateLine(text, measurer, 80);
            expect(hasLoneSurrogates(result)).toBe(false);
            expect(result.endsWith(E)).toBe(true);
        });

        it('should add ZWJ before ellipsis when truncating Arabic mid-word to preserve letter form', () => {
            // 'مرحبا' = 5 chars = 50px, truncate at 40px → cuts mid-word
            // Last Arabic letter before ellipsis should be followed by ZWJ to keep medial form
            const result = truncateLine('مرحبا', measurer, 40);
            expect(result.endsWith(E)).toBe(true);
            const beforeEllipsis = result.slice(0, -E.length);
            expect(beforeEllipsis.endsWith(ZWJ)).toBe(true);
        });

        it('should not add ZWJ when truncating non-Arabic text', () => {
            const result = truncateLine('Hello World', measurer, 80);
            expect(result).not.toContain(ZWJ);
        });

        it('should not add ZWJ when Arabic text fits without truncation', () => {
            const result = truncateLine('مرحبا', measurer, 200);
            expect(result).not.toContain(ZWJ);
        });

        it('should not add ZWJ when last Arabic char is right-join-only (e.g. Alef, Dal, Ra)', () => {
            // Right-join-only letters have identical final and isolated forms, so no ZWJ is needed.
            const result = truncateLine('ادرس', measurer, 30);
            expect(result.endsWith(E)).toBe(true);
            const beforeEllipsis = result.slice(0, -E.length);
            expect(beforeEllipsis.endsWith(ZWJ)).toBe(false);
        });
    });

    describe('ZWJ sequences', () => {
        it('should not split ZWJ emoji sequences', () => {
            const family = '👨\u200D👩\u200D👧\u200D👦';
            const text = `A ${family} B`;
            const result = truncateLine(text, measurer, 35);
            expect(hasLoneSurrogates(result)).toBe(false);
        });
    });
});

describe('wrapLines', () => {
    // With the mock measurer, each grapheme = 10px, lineHeight = 20px.
    const font = { fontSize: 12 };

    describe('textWrap: never', () => {
        it('should return single line unchanged when it fits', () => {
            // 'Hello' = 50px, maxWidth = 100px
            expect(wrapLines('Hello', { font, maxWidth: 100, textWrap: 'never' })).toEqual(['Hello']);
        });

        it('should truncate single line that does not fit', () => {
            // 'Hello World' = 110px, maxWidth = 80px
            const result = wrapLines('Hello World', { font, maxWidth: 80, textWrap: 'never' });
            expect(result).toHaveLength(1);
            expect(result[0].endsWith(E)).toBe(true);
        });

        it('should independently truncate each line of multi-line input', () => {
            const result = wrapLines('Hello World\nFoo Bar Baz', { font, maxWidth: 80, textWrap: 'never' });
            expect(result).toHaveLength(2);
            expect(result[0].endsWith(E)).toBe(true);
            expect(result[1].endsWith(E)).toBe(true);
        });

        it('should return empty array for empty input', () => {
            expect(wrapLines('', { font, maxWidth: 100, textWrap: 'never' })).toEqual([]);
        });
    });

    describe('textWrap: on-space (default)', () => {
        it('should wrap at word boundary when line exceeds maxWidth', () => {
            // 'Hello World' = 110px, maxWidth = 60px → wraps between words
            const result = wrapLines('Hello World', { font, maxWidth: 60 });
            expect(result).toEqual(['Hello', 'World']);
        });

        it('should truncate a single word longer than maxWidth', () => {
            // 'Abcdefghijk' = 110px, maxWidth = 60px, no spaces to wrap on
            const result = wrapLines('Abcdefghijk', { font, maxWidth: 60 });
            expect(result).toHaveLength(1);
            expect(result[0].endsWith(E)).toBe(true);
        });

        it('should produce multiple wrapped lines', () => {
            // 'AA BB CC DD' at maxWidth=30 → each word pair wraps
            const result = wrapLines('AA BB CC DD', { font, maxWidth: 30 });
            expect(result.length).toBeGreaterThanOrEqual(2);
            for (const line of result) {
                expect(mockMeasurer.textWidth(line)).toBeLessThanOrEqual(30);
            }
        });

        it('should handle text that fits on one line', () => {
            expect(wrapLines('Hi', { font, maxWidth: 100 })).toEqual(['Hi']);
        });

        it('should truncate long word after space-wrapped content', () => {
            // 'AA Bcdefghijk' → 'AA' fits, 'Bcdefghijk' = 100px > maxWidth 50px → truncated
            const result = wrapLines('AA Bcdefghijk', { font, maxWidth: 50 });
            expect(result.length).toBe(2);
            expect(result[0]).toBe('AA');
            expect(result[1].endsWith(E)).toBe(true);
        });
    });

    describe('textWrap: always', () => {
        it('should wrap mid-word at grapheme boundary', () => {
            // 'ABCDEF' = 60px, maxWidth = 30px → wraps after 3 chars
            const result = wrapLines('ABCDEF', { font, maxWidth: 30, textWrap: 'always' });
            expect(result).toEqual(['ABC', 'DEF']);
        });

        it('should produce lines each fitting within maxWidth', () => {
            const result = wrapLines('ABCDEFGHIJ', { font, maxWidth: 30, textWrap: 'always' });
            for (const line of result) {
                expect(mockMeasurer.textWidth(line)).toBeLessThanOrEqual(30);
            }
        });

        it('should force character-per-line at very narrow maxWidth', () => {
            // maxWidth = 10px = 1 grapheme per line
            const result = wrapLines('ABC', { font, maxWidth: 10, textWrap: 'always' });
            expect(result).toEqual(['A', 'B', 'C']);
        });

        it('should not split surrogate pairs when wrapping', () => {
            const result = wrapLines('😀😀😀😀😀', { font, maxWidth: 35, textWrap: 'always' });
            for (const line of result) {
                expect(hasLoneSurrogates(line)).toBe(false);
            }
        });

        it('should not split combining marks when wrapping', () => {
            const eAcute = 'e\u0301';
            const result = wrapLines(eAcute.repeat(10), { font, maxWidth: 50, textWrap: 'always' });
            for (const line of result) {
                expect(hasOrphanedCombiningMark(line)).toBe(false);
            }
        });
    });

    describe('textWrap: hyphenate', () => {
        it('should wrap mid-word with hyphen appended', () => {
            // 'ABCDEF' = 60px, maxWidth = 40px → 'AB-' (30px) then 'CDEF' (40px)
            // With hyphen: need room for chars + '-' (10px), so 3 chars + hyphen = 40px
            const result = wrapLines('ABCDEF', { font, maxWidth: 40, textWrap: 'hyphenate' });
            expect(result.length).toBeGreaterThanOrEqual(2);
            expect(result[0].endsWith('-')).toBe(true);
        });

        it('should produce lines fitting within maxWidth including hyphen', () => {
            const result = wrapLines('ABCDEFGHIJ', { font, maxWidth: 40, textWrap: 'hyphenate' });
            for (const line of result) {
                expect(mockMeasurer.textWidth(line)).toBeLessThanOrEqual(40);
            }
        });

        it('should not split emoji when hyphenating', () => {
            const result = wrapLines('😀😀😀😀😀', { font, maxWidth: 35, textWrap: 'hyphenate' });
            for (const line of result) {
                expect(hasLoneSurrogates(line)).toBe(false);
            }
        });
    });

    describe('Arabic text wrapping', () => {
        it('should add ZWJ at end of line when textWrap always breaks Arabic word mid-way', () => {
            // 'مرحبا' = 5 chars = 50px, maxWidth = 30px → breaks after 3 chars
            const result = wrapLines('مرحبا', { font, maxWidth: 30, textWrap: 'always' });
            expect(result.length).toBeGreaterThanOrEqual(2);
            // First line should end with ZWJ to preserve medial letter form
            expect(result[0].endsWith(ZWJ)).toBe(true);
        });

        it('should add ZWJ before hyphen when hyphenating Arabic word', () => {
            // 'مرحبا' = 5 chars = 50px, maxWidth = 40px → breaks with hyphen
            const result = wrapLines('مرحبا', { font, maxWidth: 40, textWrap: 'hyphenate' });
            expect(result.length).toBeGreaterThanOrEqual(2);
            // First line should have ZWJ before the hyphen
            const firstLine = result[0];
            expect(firstLine.endsWith('-')).toBe(true);
            const beforeHyphen = firstLine.slice(0, -1);
            expect(beforeHyphen.endsWith(ZWJ)).toBe(true);
        });

        it('should not add ZWJ when wrapping at space boundary in Arabic text', () => {
            // 'مرحبا بالعالم' wraps at the space — no mid-word break
            const result = wrapLines('مرحبا بالعالم', { font, maxWidth: 60 });
            for (const line of result) {
                expect(line).not.toContain(ZWJ);
            }
        });
    });

    describe('multi-line input with newlines', () => {
        it('should preserve pre-existing newlines as separate lines', () => {
            const result = wrapLines('AB\nCD', { font, maxWidth: 100 });
            expect(result).toEqual(['AB', 'CD']);
        });

        it('should independently wrap each line', () => {
            // Each line wraps independently
            const result = wrapLines('Hello World\nFoo Bar', { font, maxWidth: 60 });
            expect(result).toEqual(['Hello', 'World', 'Foo', 'Bar']);
        });

        it('should preserve empty lines', () => {
            const result = wrapLines('AB\n\nCD', { font, maxWidth: 100 });
            expect(result).toEqual(['AB', '', 'CD']);
        });
    });

    describe('avoidOrphans', () => {
        it('should move orphan word to join previous line when enabled (default)', () => {
            // At maxWidth=90 the natural wrap leaves 'G' alone on the last line; avoidOrphans moves
            // 'FF' down to join it.
            const result = wrapLines('AA BB CC DD EE FF G', { font, maxWidth: 90 });
            const lastLine = result.at(-1)!;
            expect(lastLine.split(' ').length).toBeGreaterThan(1);
        });

        it('should leave orphan on its own line when avoidOrphans is false', () => {
            const result = wrapLines('AA BB CC DD EE FF G', {
                font,
                maxWidth: 90,
                avoidOrphans: false,
            });
            const lastLine = result.at(-1)!;
            expect(lastLine).toBe('G');
        });
    });

    describe('overflow: hide', () => {
        it('should return empty array when truncation occurs with overflow hide', () => {
            // 'Hello World' at maxWidth=60 with textWrap='never' → truncated
            const result = wrapLines('Hello World', {
                font,
                maxWidth: 60,
                textWrap: 'never',
                overflow: 'hide',
            });
            expect(result).toEqual([]);
        });

        it('should return text normally when it fits with overflow hide', () => {
            const result = wrapLines('Hello', { font, maxWidth: 100, textWrap: 'never', overflow: 'hide' });
            expect(result).toEqual(['Hello']);
        });
    });
    it('keeps an orphan on its own line when moving it back would overrun the width', () => {
        // Pulling the previous line's last word down to join the orphan adds a space, and the joined line
        // has to be measured as it will be drawn: 'CC DDDD' is 70px, so the 65px budget cannot take it.
        expect(wrapLines('A B CC DDDD', { font, maxWidth: 65, textWrap: 'on-space' })).toEqual(['A B CC', 'DDDD']);
    });
});

describe('clipLines', () => {
    const measurer = createMockMeasurer(10);
    const font = { fontSize: 12 };

    it('should return lines unchanged when no maxHeight', () => {
        const lines = ['Hello', 'World'];
        expect(clipLines(lines, measurer, { font, maxWidth: 100 })).toEqual(lines);
    });

    it('should return lines unchanged when they fit within maxHeight', () => {
        // 2 lines × 20px = 40px, maxHeight = 50px
        const lines = ['Hello', 'World'];
        expect(clipLines(lines, measurer, { font, maxWidth: 100, maxHeight: 50 })).toEqual(lines);
    });

    it('should clip lines exceeding maxHeight and truncate last visible line', () => {
        // 3 lines × 20px = 60px, maxHeight = 35px → only 1 full line fits
        const lines = ['Hello', 'World', 'Foo'];
        const result = clipLines(lines, measurer, { font, maxWidth: 100, maxHeight: 35 });
        // First line fits (20px), second starts at 40px > 35px → clip at index 1
        // Returns lines[0..0] with last line truncated (ellipsis forced)
        expect(result).toHaveLength(1);
        expect(result[0].endsWith(E)).toBe(true);
    });

    it('should return empty array with overflow hide when clipping occurs', () => {
        const lines = ['Hello', 'World', 'Foo'];
        const result = clipLines(lines, measurer, { font, maxWidth: 100, maxHeight: 35, overflow: 'hide' });
        expect(result).toEqual([]);
    });

    it('should return empty array when single line exceeds maxHeight', () => {
        // 1 line = 20px, maxHeight = 10px → even first line doesn't fit
        const lines = ['Hello'];
        const result = clipLines(lines, measurer, { font, maxWidth: 100, maxHeight: 10 });
        expect(result).toEqual([]);
    });

    it('should handle exact fit (height equals maxHeight)', () => {
        // 2 lines × 20px = 40px, maxHeight = 40px → exact fit
        const lines = ['Hello', 'World'];
        expect(clipLines(lines, measurer, { font, maxWidth: 100, maxHeight: 40 })).toEqual(lines);
    });
});

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

// The text of the first text segment that carries visible content, used to assert that a
// segment's leading whitespace (the gap to a preceding image) survives wrapping.
function firstText(result: MeasuredSegment[]): string {
    const seg = result.find((s): s is MeasuredSegment & { text: string } => s.type !== 'image' && s.text.trim() !== '');
    return seg?.text ?? '';
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
        // 'hide' image must be gone; 'keep' image stays unless we have no other choice.
        expect(imageUrls(result)).not.toContain('https://example.com/hide1.png');
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

        // Re-measuring the wrap output with the real measurer sees two lines.
        const remeasured = measureTextSegments(result, baseFont);
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
        const remeasured = measureTextSegments(result, baseFont);
        expect(remeasured.lineMetrics).toHaveLength(2);
        expect(remeasured.lineMetrics[1].segments).toHaveLength(1);
        expect(remeasured.lineMetrics[1].segments[0]).toMatchObject({ text: 'Subtitle' });
    });

    describe('wraps an overflowing inline image to a new line instead of dropping it', () => {
        // 'ABCD' = 40px, image = 30px → 70px overflows a 50px line, but the image fits on its own.
        const segments: ContentSegment[] = [text('ABCD'), image('flag', { width: 30, height: 30 })];

        it('keeps the image and moves it to the next line when wrapping is enabled', () => {
            const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 50 });

            expect(imageUrls(result)).toEqual(['https://example.com/flag.png']);
            // The image flows onto a second line below the text rather than being dropped.
            const remeasured = measureTextSegments(result, baseFont);
            expect(remeasured.lineMetrics).toHaveLength(2);
            expect(remeasured.lineMetrics[1].segments).toHaveLength(1);
            expect(remeasured.lineMetrics[1].segments[0].type).toBe('image');
        });

        it('keeps the image inline when there is room (wider box)', () => {
            const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 200 });

            expect(imageUrls(result)).toEqual(['https://example.com/flag.png']);
            expect(measureTextSegments(result, baseFont).lineMetrics).toHaveLength(1);
        });

        it("drops the image only when it cannot fit on a line of its own ('hide')", () => {
            // Image (30px) is wider than the whole box (20px); no line can hold it, so it drops.
            const tight: ContentSegment[] = [text('AB'), image('flag', { width: 30, height: 30 })];
            const result = wrapTextSegments(tight, { font: baseFont, maxWidth: 20 });

            expect(imageUrls(result)).toEqual([]);
            expect(textOf(result)).toBe('AB');
        });

        it('does not wrap the image to a new line when wrapping is disabled', () => {
            const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 50, textWrap: 'never' });

            // With 'never', the image cannot move to a new line and the default 'hide' drops it.
            expect(imageUrls(result)).toEqual([]);
        });

        it('drops the image when there is no vertical room for another line', () => {
            // First text line commits 20px; maxHeight only allows that one line, so the image
            // cannot wrap below and is dropped instead.
            const stacked: ContentSegment[] = [text('AA\nBB'), image('flag', { width: 30, height: 30 })];
            const result = wrapTextSegments(stacked, {
                font: baseFont,
                maxWidth: 50,
                maxHeight: LINE_HEIGHT,
                overflow: 'ellipsis',
            });

            expect(imageUrls(result)).toEqual([]);
        });

        it('drops the image when the text line it would leave behind exhausts the vertical room', () => {
            // maxHeight fits the image alone but not the wrapped text line above it, so the image drops.
            const result = wrapTextSegments(segments, {
                font: baseFont,
                maxWidth: 50,
                maxHeight: 40,
                overflow: 'ellipsis',
            });

            expect(imageUrls(result)).toEqual([]);
            expect(textOf(result)).toContain('ABCD');
        });
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
        expect(textOf(result)).toContain('\n');
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
        // Without lineHeight, two LINE_HEIGHT-tall lines fit inside maxHeight.
        const naturalFit = wrapTextSegments([text('Foo'), text('\nBar')], {
            font: baseFont,
            maxWidth: 200,
            maxHeight: LINE_HEIGHT * 2 + 10,
        });
        expect(textOf(naturalFit)).toBe('Foo\nBar');

        // A larger lineHeight on the first segment consumes the budget, dropping the second line.
        const overrideFit = wrapTextSegments([text('Foo', { lineHeight: 40 }), text('\nBar')], {
            font: baseFont,
            maxWidth: 200,
            maxHeight: LINE_HEIGHT * 2 + 10,
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

    it('treats adjacent block:true images mid-line as inline (no spurious block strip)', () => {
        // text, block-image, block-image, text: neither image follows a `\n` or index 0, so the run is
        // mid-line and both images must stay inline rather than the second becoming a block strip.
        const segments: ContentSegment[] = [
            text('Prefix '),
            image('a', { width: 20, height: 20, block: true }),
            image('b', { width: 20, height: 20, block: true }),
            text(' suffix'),
        ];
        const result = wrapTextSegments(segments, { font: baseFont, maxWidth: 500 });

        expect(imageUrls(result)).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
        // The whole row stays a single inline line — no block markers.
        const remeasured = measureTextSegments(result, baseFont);
        expect(remeasured.lineMetrics).toHaveLength(1);
        expect(remeasured.lineMetrics[0].blockImages).toBeUndefined();
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
        const remeasured = measureTextSegments(result, baseFont);
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

        const remeasured = measureTextSegments(result, baseFont);
        // Two rows: line 0 'Header' (no block marker), line 1 block-image + 'Body'.
        expect(remeasured.lineMetrics).toHaveLength(2);
        expect(remeasured.lineMetrics[0].blockImages).toBeUndefined();
        expect(remeasured.lineMetrics[1].blockImages).toBeDefined();
    });
});

// The wrapper must honour the user-supplied wrap mode (or theme default) when a label mixes text and
// image segments.
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
        // The text segment's leading space (the gap to the preceding image) must survive the wrap —
        // a break landing on that edge whitespace must not strip it.
        expect(firstText(result).startsWith(' ')).toBe(true);
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

    it("preserves a text segment's leading and trailing space (image gaps) across a wrap", () => {
        // Flag/text/arrow label: the space on each side of the country name is the gap to its neighbours.
        // A narrow wrap can break on that edge whitespace, so it must be restored or they end up touching.
        const segments: ContentSegment[] = [
            image('flag', { width: 20, height: 13, overflowStrategy: 'keep' }),
            text(' Germany '),
            image('arrow', { width: 12, height: 12, overflowStrategy: 'hide' }),
        ];
        const result = wrapTextSegments(segments, {
            font: baseFont,
            maxWidth: 90,
            maxHeight: 200,
            textWrap: 'on-space',
        });

        expect(textOf(result)).not.toMatch(/…/);
        // 'Germany' wraps onto its own line below the flag, but both its leading space (flag→text
        // gap) and trailing space (text→arrow gap) survive — only the wrap line break is added.
        expect(firstText(result).replace(/\n/g, '')).toBe(' Germany ');
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

describe('fitLabelText', () => {
    const font: FontOptions = { fontSize: 10, fontFamily: 'sans-serif' };

    it('returns the text unchanged when no fit policy is supplied', () => {
        expect(fitLabelText('Hello World', undefined, font)).toBe('Hello World');
    });

    it('returns the text unchanged when the policy sets no width or height bound', () => {
        expect(fitLabelText('Hello World', { wrapping: 'always' }, font)).toBe('Hello World');
    });

    it('wraps text to the maxWidth budget', () => {
        // Each grapheme is 10px, so a 60px budget fits 6 chars per line.
        expect(fitLabelText('Hello World', { maxWidth: 60 }, font)).toBe('Hello\nWorld');
    });

    it('keeps the text whole when wrapping is disabled and no overflow strategy is set', () => {
        expect(fitLabelText('Hello World', { maxWidth: 60, wrapping: 'never' }, font)).toBe('Hello World');
    });

    it('truncates with an ellipsis when the policy asks for one', () => {
        expect(
            fitLabelText('Hello World', { maxWidth: 60, wrapping: 'never', overflowStrategy: 'ellipsis' }, font)
        ).toBe(`Hello${E}`);
    });

    it('ignores maxHeight when no overflow strategy is set, since honouring it would drop lines', () => {
        const result = fitLabelText('one two three four', { maxWidth: 60, maxHeight: 20, wrapping: 'on-space' }, font);
        expect(result).toBe('one\ntwo\nthree\nfour');
        expect(String(result)).not.toContain(E);
    });

    it('lets an unbreakable word overhang while continuing to wrap the remainder', () => {
        expect(fitLabelText('Hi Verylongword ok', { maxWidth: 60, wrapping: 'on-space' }, font)).toBe(
            'Hi\nVerylongword\nok'
        );
    });

    it('loses no characters when hyphenating a word wider than the bound', () => {
        const result = String(fitLabelText('Extraordinarily', { maxWidth: 60, wrapping: 'hyphenate' }, font));
        expect(result).toContain('-');
        expect(result.replaceAll('\n', '').replaceAll('-', '')).toBe('Extraordinarily');
    });

    it('hides the label when the policy asks to hide overflow', () => {
        expect(fitLabelText('Hello World', { maxWidth: 60, wrapping: 'never', overflowStrategy: 'hide' }, font)).toBe(
            ''
        );
    });

    it('drops no segment when text overhangs alongside an image narrower than the bound', () => {
        const segments = [image('flag', { width: 20, height: 20 }), text(' Verylongcaption here')];
        const result = fitLabelText(segments, { maxWidth: 60, wrapping: 'on-space' }, font);
        expect(Array.isArray(result)).toBe(true);
        const measured = result as MeasuredSegment[];
        expect(imageUrls(measured)).toEqual(['https://example.com/flag.png']);
        expect(textOf(measured)).not.toContain(E);
        expect(textOf(measured).replace(/\s+/g, ' ').trim()).toBe('Verylongcaption here');
    });
});

describe('fitLabelText bounded by a shape', () => {
    const font: FontOptions = { fontSize: 10, fontFamily: 'sans-serif' };

    // A shape whose room changes across the anchor: `above` is offered to any band reaching over the
    // anchor, `below` to the bands under it. A pyramid's apex stage and the outer half of a pie wedge are
    // both this shape, and each is drawn from a baseline that is not the block's centre.
    function splitRegion(above: number, below: number): FitRegion {
        return {
            spanAt: (top) => {
                const half = (top < 0 ? above : below) / 2;
                return [-half, half];
            },
            extentAbove: 40,
            extentBelow: 40,
        };
    }

    it('wraps each line to the room the shape offers where that line sits', () => {
        // 'AAAA BBBB' is two 40px words. Centred on the anchor the first line lands above it, where the
        // shape offers 40px, so the words cannot share a line; the second line has 200px and keeps its own.
        expect(fitLabelText('AAAA BBBB', { region: splitRegion(40, 200), wrapping: 'on-space' }, font)).toBe(
            'AAAA\nBBBB'
        );
    });

    it('wraps a block drawn from the anchor downwards to the bands below it', () => {
        // Same shape, but the label is drawn from a top baseline, so both lines sit in the 200px half and
        // the words share a line.
        expect(
            fitLabelText(
                'AAAA BBBB',
                { region: splitRegion(40, 200), regionAlign: 'start', wrapping: 'on-space' },
                font
            )
        ).toBe('AAAA BBBB');
    });

    it('does not let a block drawn downwards use room the shape only offers above the anchor', () => {
        // The mirror case, and the damaging one: the block sits entirely in the 40px half, so it must wrap
        // there rather than reading its width off the half it is never drawn in.
        expect(
            fitLabelText(
                'AAAA BBBB',
                { region: splitRegion(200, 40), regionAlign: 'start', wrapping: 'on-space' },
                font
            )
        ).toBe('AAAA\nBBBB');
    });

    it('marks text it had to drop where the shape narrowed to nothing', () => {
        // A shape can starve a line of width entirely (a wedge's inner end, a pyramid's apex). The wrap
        // stops there, and what it could not place has to be marked like any other overflow.
        const region: FitRegion = {
            spanAt: (_top, bottom) => (bottom <= 20 ? [-50, 50] : [0, 0]),
            extentAbove: 0,
            extentBelow: 100,
        };
        const result = String(
            fitLabelText('AAAA BBBB CCCC DDDD', { region, wrapping: 'on-space', overflowStrategy: 'ellipsis' }, font)
        );
        expect(result.endsWith(E)).toBe(true);
    });

    it('sizes a band from one line, not from the whole of a multi-line source', () => {
        // A wide top row and a narrow one below it, and a source that already carries its own line break.
        // Each line has to be measured against the row it lands in; taking the band from the block's whole
        // height puts the first line in the narrow row and mangles text that had room to spare.
        const region: FitRegion = {
            spanAt: (_top, bottom) => (bottom <= LINE_HEIGHT ? [-100, 100] : [-10, 10]),
            extentAbove: 0,
            extentBelow: 2 * LINE_HEIGHT,
        };
        expect(
            fitLabelText(
                'AAAABBBB\nX',
                { region, regionAlign: 'start', wrapping: 'on-space', overflowStrategy: 'ellipsis' },
                font
            )
        ).toBe('AAAABBBB\nX');
    });

    it('terminates on a region that reports an unbounded extent', () => {
        // FitRegion is a public contract, so a region may report unbounded room. Text that can never fit
        // whole never satisfies the early exit, so the search over line counts has to be bounded by the
        // source rather than by the room.
        const region: FitRegion = {
            spanAt: () => [-CHAR_WIDTH / 2, CHAR_WIDTH / 2],
            extentAbove: Infinity,
            extentBelow: Infinity,
        };
        const result = String(
            fitLabelText('AAAA BBBB', { region, wrapping: 'on-space', overflowStrategy: 'ellipsis' }, font)
        );
        expect(result.length).toBeGreaterThan(0);
    });

    it('centres the block where the room is when the shape is lopsided about the anchor', () => {
        // All the room lies to the left of the anchor: a block centred on the anchor could only use twice
        // the 10px on its right, so the fit moves it into the 100px the shape actually offers.
        const region: FitRegion = {
            spanAt: () => [-110, 10],
            extentAbove: 20,
            extentBelow: 20,
        };
        const fitted = fitLabelTextToRegion('AAAA BBBB', { region, wrapping: 'on-space' }, font);
        expect(fitted.text).toBe('AAAA BBBB');
        expect(fitted.offsetX).toBe(-50);
    });

    it('cuts a word that will not fit to the width of the line it lands on', () => {
        // A narrow top row over a wide one, and a word too wide for the row the wrap is closing: the word
        // moves to the row below, so it is cut to that row's width and not to the one it left.
        const region: FitRegion = {
            spanAt: (_top, bottom) => (bottom <= LINE_HEIGHT ? [-25, 25] : [-45, 45]),
            extentAbove: 0,
            extentBelow: 2 * LINE_HEIGHT,
        };
        expect(
            fitLabelText(
                'AAAA BBBBBBBB',
                { region, regionAlign: 'start', wrapping: 'on-space', overflowStrategy: 'ellipsis' },
                font
            )
        ).toBe('AAAA\nBBBBBBBB');
    });

    it('fits a lopsided shape at the anchor for a caller that cannot move the label', () => {
        // The same region, through the API that returns text alone: an offset it cannot report must not be
        // taken, or the text is fitted to room the label is never drawn in.
        const region: FitRegion = {
            spanAt: () => [-110, 10],
            extentAbove: 20,
            extentBelow: 20,
        };
        const fitted = fitLabelText('AAAA BBBB', { region, wrapping: 'on-space' }, font);
        expect(fitted).toBe('AAAA\nBBBB');
    });
});
