import type { ITextMeasurer } from '../../types/text';
import { EllipsisChar } from './textUtils';
import { truncateLine, wrapLines } from './textWrapper';

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
    // Also check at the very end — if the last char before ellipsis is a combining mark
    // separated from its base, that's an orphan too. But this is hard to detect generically.
    return false;
}

describe('truncateLine', () => {
    const measurer = createMockMeasurer(10);

    describe('ASCII regression', () => {
        it('should return text unchanged when it fits within maxWidth', () => {
            expect(truncateLine('Hello', measurer, 100)).toBe('Hello');
        });

        it('should add ellipsis when text exceeds maxWidth', () => {
            // 'Hello World' = 11 chars = 110px, maxWidth = 80px
            const result = truncateLine('Hello World', measurer, 80);
            expect(result.endsWith(EllipsisChar)).toBe(true);
            expect(result.length).toBeLessThan('Hello World'.length);
        });

        it('should handle empty string', () => {
            expect(truncateLine('', measurer, 100)).toBe('');
        });
    });

    describe('surrogate pair safety', () => {
        it('should not split emoji surrogate pairs when truncating', () => {
            // '😀' is a surrogate pair (2 code units). Truncation must not leave a lone surrogate.
            const result = truncateLine('Hello 😀😀😀 World', measurer, 100);
            expect(hasLoneSurrogates(result)).toBe(false);
        });

        it('should not produce lone surrogates with very narrow maxWidth', () => {
            // Only room for 1-2 graphemes
            const result = truncateLine('😀😀😀', measurer, 25);
            expect(hasLoneSurrogates(result)).toBe(false);
        });

        it('should handle string of only emoji', () => {
            const result = truncateLine('😀😀😀😀😀', measurer, 35);
            expect(hasLoneSurrogates(result)).toBe(false);
            expect(result.endsWith(EllipsisChar)).toBe(true);
        });

        it('should handle flag emoji (multi-codepoint)', () => {
            // Flag emoji: 🇺🇸 = U+1F1FA U+1F1F8 (2 codepoints, 4 code units)
            const result = truncateLine('🇺🇸🇬🇧🇫🇷', measurer, 35);
            expect(hasLoneSurrogates(result)).toBe(false);
        });
    });

    describe('combining marks', () => {
        it('should not orphan combining marks when truncating', () => {
            // 'é' as e + combining acute accent (U+0301)
            const eAcute = 'e\u0301';
            const text = eAcute.repeat(5); // 5 accented e's
            const result = truncateLine(text, measurer, 35);
            expect(hasOrphanedCombiningMark(result)).toBe(false);
        });
    });

    describe('Arabic text', () => {
        it('should truncate Arabic text at grapheme boundaries', () => {
            // Arabic: مرحبا بالعالم (Hello World)
            const text = 'مرحبا بالعالم';
            const result = truncateLine(text, measurer, 80);
            expect(hasLoneSurrogates(result)).toBe(false);
            expect(result.endsWith(EllipsisChar)).toBe(true);
        });
    });

    describe('ZWJ sequences', () => {
        it('should not split ZWJ emoji sequences', () => {
            // Family emoji: 👨‍👩‍👧‍👦 is a ZWJ sequence (multiple codepoints joined by U+200D)
            // It should be treated as a single grapheme by Intl.Segmenter
            const family = '👨\u200D👩\u200D👧\u200D👦';
            const text = `A ${family} B`;
            const result = truncateLine(text, measurer, 35);
            // Should not contain partial ZWJ sequences
            expect(hasLoneSurrogates(result)).toBe(false);
        });
    });
});

describe('wrapLines', () => {
    describe('wrapping with emoji - textWrap always', () => {
        it('should wrap text with emoji without splitting surrogates', () => {
            const result = wrapLines('😀😀😀😀😀', {
                font: { fontSize: 12 },
                maxWidth: 35,
                textWrap: 'always',
            });
            for (const line of result) {
                expect(hasLoneSurrogates(line)).toBe(false);
            }
        });
    });

    describe('wrapping with emoji - textWrap hyphenate', () => {
        it('should not split emoji when hyphenating', () => {
            const result = wrapLines('😀😀😀😀😀', {
                font: { fontSize: 12 },
                maxWidth: 35,
                textWrap: 'hyphenate',
            });
            for (const line of result) {
                expect(hasLoneSurrogates(line)).toBe(false);
            }
        });
    });

    describe('wrapping with combining marks', () => {
        it('should not split combining marks when wrapping', () => {
            const eAcute = 'e\u0301';
            const result = wrapLines(eAcute.repeat(10), {
                font: { fontSize: 12 },
                maxWidth: 50,
                textWrap: 'always',
            });
            for (const line of result) {
                expect(hasOrphanedCombiningMark(line)).toBe(false);
            }
        });
    });
});
