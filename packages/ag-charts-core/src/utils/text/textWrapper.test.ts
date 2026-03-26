import type { ITextMeasurer } from '../../types/text';
import { EllipsisChar } from './textUtils';
import { clipLines, truncateLine, wrapLines } from './textWrapper';

// Mock cachedTextMeasurer so wrapLines uses our fixed-width measurer.
const mockMeasurer = createMockMeasurer(10);
jest.mock('../../rendering/textMeasurer', () => ({
    cachedTextMeasurer: () => mockMeasurer,
    measureTextSegments: jest.fn(),
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

// Helper: returns true if any combining mark (U+0300–U+036F) appears
// at position 0 of the string or immediately after a non-base character,
// indicating it was orphaned from its base.
function hasOrphanedCombiningMark(str: string): boolean {
    // A combining mark at position 0 is always orphaned
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
            // ا (Alef U+0627), د (Dal U+062F), ر (Ra U+0631) are right-join-only
            // Their final form is the same as isolated, so no ZWJ needed
            // 'ادر' = 3 chars, truncate at 30px (fits 2 chars + ellipsis)
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
            // 'AA BB CC DD EE FF G' at maxWidth=90:
            // Line 1: 'AA BB CC' (80px fits, 'DD' would push to 100 > 90)
            // Line 2: 'DD EE FF' (80px fits, 'G' would push to 100 > 90)
            // Line 3: 'G' → orphan (single word)
            // avoidOrphans: beforeLast='DD EE FF' has 2 spaces, lastLine='G' has no space
            // → moves 'FF' down: ['AA BB CC', 'DD EE', 'FF G']
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
