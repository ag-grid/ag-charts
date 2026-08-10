import { describe, expect, it, vi } from 'vitest';

import { fitLabelTextAutoSize, fontWithSize } from './textWrapper';

// Mock only the canvas leaf, as textWrapper.test.ts does, but scale the metrics with the font so the
// font-size search has something to search over: a grapheme is `fontSize` px wide and a line
// `1.5 * fontSize` px tall. Kept in its own file because the sibling suite pins a fixed glyph width.
vi.mock('../canvas', () => ({
    createCanvasContext: () => ({
        font: '10px',
        measureText(text: string) {
            const fontSize = Number.parseFloat(this.font);
            return {
                width: [...text].length * fontSize,
                fontBoundingBoxAscent: fontSize * 1.2,
                fontBoundingBoxDescent: fontSize * 0.3,
                emHeightAscent: fontSize * 1.2,
                emHeightDescent: fontSize * 0.3,
            };
        },
    }),
}));

const ELLIPSIS = '…';
const font = { fontSize: 20, fontFamily: 'sans-serif' } as const;

describe('fitLabelTextAutoSize', () => {
    it('keeps the configured size when no minimum is set', () => {
        const fitted = fitLabelTextAutoSize('abcd', { maxWidth: 40, wrapping: 'never' }, font);
        expect(fitted.fontSize).toBeUndefined();
    });

    it('keeps the configured size when the text already fits', () => {
        // 4 graphemes at 20px = 80px, inside the bound, so nothing is shrunk.
        const fitted = fitLabelTextAutoSize('abcd', { maxWidth: 100, minimumFontSize: 8 }, font);
        expect(fitted).toEqual({ text: 'abcd', fontSize: undefined });
    });

    it('shrinks to the largest size that holds the whole text', () => {
        // 4 graphemes must fit 40px, so the largest whole-text size is 10px.
        const fitted = fitLabelTextAutoSize('abcd', { maxWidth: 40, wrapping: 'never', minimumFontSize: 4 }, font);
        expect(fitted).toEqual({ text: 'abcd', fontSize: 10 });
    });

    it('shrinks rather than truncating when truncation is allowed', () => {
        const fit = { maxWidth: 40, wrapping: 'never', overflowStrategy: 'ellipsis', minimumFontSize: 4 } as const;
        expect(fitLabelTextAutoSize('abcd', fit, font)).toEqual({ text: 'abcd', fontSize: 10 });
    });

    it('truncates at the minimum size when even that does not fit', () => {
        const fit = { maxWidth: 40, wrapping: 'never', overflowStrategy: 'ellipsis', minimumFontSize: 16 } as const;
        const fitted = fitLabelTextAutoSize('abcdefgh', fit, font);
        expect(fitted.fontSize).toBe(16);
        expect(String(fitted.text)).toContain(ELLIPSIS);
    });

    it('hides at the minimum size when the overflow strategy hides', () => {
        const fit = { maxWidth: 40, wrapping: 'never', overflowStrategy: 'hide', minimumFontSize: 16 } as const;
        expect(fitLabelTextAutoSize('abcdefgh', fit, font).text).toBe('');
    });

    it('shrinks to fit a height bound rather than dropping lines', () => {
        // Two 10px-wide graphemes per line at 20px, so the text wraps to two lines of 1.5 * fontSize.
        const fit = { maxWidth: 40, maxHeight: 30, wrapping: 'always', minimumFontSize: 5 } as const;
        const fitted = fitLabelTextAutoSize('abcd', fit, font);
        expect(fitted.fontSize).toBe(10);
        expect(fitted.text).toBe('abcd');
    });

    it('ignores a minimum above the configured size and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const fitted = fitLabelTextAutoSize('abcd', { maxWidth: 40, wrapping: 'never', minimumFontSize: 30 }, font);
        expect(fitted.fontSize).toBeUndefined();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('keeps a fractional configured size that already fits', () => {
        // The search visits integers only, so a size it cannot land on must come from the up-front probe
        // rather than be rounded down to the nearest integer that fits.
        const fitted = fitLabelTextAutoSize('ab', { maxWidth: 40, wrapping: 'never', minimumFontSize: 5 }, {
            ...font,
            fontSize: 12.5,
        } as const);
        expect(fitted.fontSize).toBeUndefined();
        expect(fitted.text).toBe('ab');
    });

    it('never shrinks below a fractional minimum', () => {
        // 4 graphemes fit 36px whole at 9px. Bisecting to integers would also probe 8 for a floor of
        // 8.5 and could settle there, rendering the label smaller than the size the user asked for.
        const fit = { maxWidth: 36, wrapping: 'never', overflowStrategy: 'ellipsis', minimumFontSize: 8.5 } as const;
        const fitted = fitLabelTextAutoSize('abcd', fit, font);
        expect(fitted).toEqual({ text: 'abcd', fontSize: 9 });
    });

    it('applies the overflow strategy at a fractional minimum', () => {
        // 4 graphemes cannot fit 30px at any size down to the floor, so the ellipsis must take over at
        // 8.5 rather than back at the configured 20 — a size the integer search can never land on.
        const fit = { maxWidth: 30, wrapping: 'never', overflowStrategy: 'ellipsis', minimumFontSize: 8.5 } as const;
        const fitted = fitLabelTextAutoSize('abcd', fit, font);
        expect(fitted.fontSize).toBe(8.5);
        expect(fitted.text).toContain(ELLIPSIS);
    });

    it('does not shrink without a bound to shrink into', () => {
        expect(fitLabelTextAutoSize('abcd', { minimumFontSize: 4 }, font).fontSize).toBeUndefined();
    });
});

describe('fontWithSize', () => {
    it('returns the same object when the size is unchanged', () => {
        expect(fontWithSize(font, undefined)).toBe(font);
        expect(fontWithSize(font, 20)).toBe(font);
    });

    it('overrides only the size', () => {
        expect(fontWithSize(font, 12)).toEqual({ fontSize: 12, fontFamily: 'sans-serif' });
    });
});
