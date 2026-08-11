import { describe, expect, it } from 'vitest';

import { LtrEmbedding, PopDirectionalFormatting } from '../../types/text';
import { forceLtrNumbers, isDirectionNeutral, toFontString } from './textUtils';

describe('toFontString', () => {
    const baseFont = { fontSize: 14 };

    describe('font-family quoting', () => {
        it('leaves single-word family unquoted', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial' })).toBe('14px Arial');
        });

        it('leaves CSS generic keywords unquoted', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'sans-serif' })).toBe('14px sans-serif');
            expect(toFontString({ ...baseFont, fontFamily: 'serif' })).toBe('14px serif');
            expect(toFontString({ ...baseFont, fontFamily: 'monospace' })).toBe('14px monospace');
            expect(toFontString({ ...baseFont, fontFamily: 'system-ui' })).toBe('14px system-ui');
        });

        it('quotes multi-word family names', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Helvetica Neue' })).toBe('14px "Helvetica Neue"');
        });

        it('quotes family names containing digits', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Font Awesome 6 Free' })).toBe('14px "Font Awesome 6 Free"');
        });

        it('preserves already double-quoted family', () => {
            expect(toFontString({ ...baseFont, fontFamily: '"Already Quoted"' })).toBe('14px "Already Quoted"');
        });

        it('preserves already single-quoted family', () => {
            expect(toFontString({ ...baseFont, fontFamily: "'Already Quoted'" })).toBe("14px 'Already Quoted'");
        });

        it('handles comma-separated lists, quoting only tokens that need it', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial, sans-serif' })).toBe('14px Arial, sans-serif');
            expect(toFontString({ ...baseFont, fontFamily: 'Helvetica Neue, Arial, sans-serif' })).toBe(
                '14px "Helvetica Neue", Arial, sans-serif'
            );
            expect(toFontString({ ...baseFont, fontFamily: 'Font Awesome 6 Free, sans-serif' })).toBe(
                '14px "Font Awesome 6 Free", sans-serif'
            );
        });

        it('returns identical results on repeated calls (memoised quoting)', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Helvetica Neue' })).toBe('14px "Helvetica Neue"');
            expect(toFontString({ ...baseFont, fontFamily: 'Helvetica Neue' })).toBe('14px "Helvetica Neue"');
            // A different family must not be served the cached entry of another.
            expect(toFontString({ ...baseFont, fontFamily: 'Arial' })).toBe('14px Arial');
        });
    });

    describe('weight and style', () => {
        it('omits weight 400 and normal', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial', fontWeight: 400 })).toBe('14px Arial');
            expect(toFontString({ ...baseFont, fontFamily: 'Arial', fontWeight: 'normal' })).toBe('14px Arial');
        });

        it('converts weight 700 to bold', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial', fontWeight: 700 })).toBe('bold 14px Arial');
        });

        it('preserves numeric weights other than 400 and 700', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial', fontWeight: 900 })).toBe('900 14px Arial');
        });

        it('emits weight 900 with a quoted multi-word family', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Font Awesome 6 Free', fontWeight: 900 })).toBe(
                '900 14px "Font Awesome 6 Free"'
            );
        });

        it('prepends fontStyle when set', () => {
            expect(toFontString({ ...baseFont, fontFamily: 'Arial', fontStyle: 'italic' })).toBe('italic 14px Arial');
        });
    });
});

describe('isDirectionNeutral', () => {
    it.each([['-5'], ['1,234.56'], ['-5.5%'], ['12:30'], ['$5'], ['(5)'], ['']])(
        'reports %j as carrying no direction of its own',
        (text) => {
            expect(isDirectionNeutral(text)).toBe(true);
        }
    );

    it.each([
        ['\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA'],
        ['\u0645\u0628\u064A\u0639\u0627\u062A'],
        ['Sales'],
        ['5 kg'],
        ['-5 to 10'],
        ['\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA -5'],
    ])('reports %j as carrying its own direction', (text) => {
        expect(isDirectionNeutral(text)).toBe(false);
    });

    it('treats Arabic-Indic digits as numbers rather than strong characters', () => {
        expect(isDirectionNeutral('\u0660\u0661')).toBe(true);
    });
});

describe('forceLtrNumbers', () => {
    const mark = (text: string) => LtrEmbedding + text + PopDirectionalFormatting;

    it.each([
        ['-5'],
        ['+5'],
        ['\u22125'],
        ['-5.5%'],
        ['$1,234.56'],
        ['1,234.56 USD'],
        ['5 kg'],
        ['5\u00B0C'],
        ['12:30'],
        ['2.5e-3'],
        ['0'],
    ])('marks %j as a single left-to-right run', (text) => {
        expect(forceLtrNumbers(text)).toBe(mark(text));
    });

    it('marks the number inside RTL text, leaving the text alone', () => {
        expect(forceLtrNumbers('\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA -5 kg')).toBe(
            `\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA ${mark('-5 kg')}`
        );
        expect(forceLtrNumbers('5 \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA')).toBe(
            `${mark('5')} \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA`
        );
    });

    it.each([['5-10'], ['-5-10'], ['1,000 - 2,000'], ['5 kg - 10 kg'], ['5–10']])(
        'keeps the range %j in a single run, so its halves cannot reorder against each other',
        (text) => {
            expect(forceLtrNumbers(text)).toBe(mark(text));
        }
    );

    it('marks a range inside RTL text as one run', () => {
        expect(forceLtrNumbers('מכירות 5-10')).toBe(`מכירות ${mark('5-10')}`);
    });

    it('does not join two numbers separated by a word into a range', () => {
        expect(forceLtrNumbers('2024 - מכירות')).toBe(`${mark('2024')} - מכירות`);
    });

    it('treats a token between two numbers as a word, not a unit', () => {
        expect(forceLtrNumbers('-5 to 10')).toBe(`${mark('-5')} to 10`);
    });

    it.each([['Sales for 2024'], ['for -5'], ['sold 5 kg in 2024']])(
        'leaves %j alone, since the bidi algorithm already carries it along the preceding LTR run',
        (text) => {
            expect(forceLtrNumbers(text)).toBe(text);
        }
    );

    it('marks a number whose nearest preceding strong text is RTL', () => {
        expect(forceLtrNumbers('Sales \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA -5')).toBe(
            `Sales \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA ${mark('-5')}`
        );
    });

    it('leaves text carrying no number alone', () => {
        const text = 'Sales \u05DE\u05DB\u05D9\u05E8\u05D5\u05EA';
        expect(forceLtrNumbers(text)).toBe(text);
    });
});
