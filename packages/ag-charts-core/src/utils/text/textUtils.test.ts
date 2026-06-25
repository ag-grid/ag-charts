import { describe, expect, it } from 'vitest';

import { toFontString } from './textUtils';

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
