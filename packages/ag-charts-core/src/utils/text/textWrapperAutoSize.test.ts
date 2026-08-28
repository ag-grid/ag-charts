import { describe, expect, it, vi } from 'vitest';

import type {
    NormalisedContentSegment,
    NormalisedTextSegment,
} from '../../types/normalised-options/normalisedCommonOptions';
import type { MeasuredSegment } from '../../types/text';
import {
    type AutoSizedLabelText,
    findLargestFittingFontSize,
    findLargestFontSizeDescending,
    fitLabelTextAutoSize,
    fontWithSize,
    labelTextAtShrinkRatio,
} from './textWrapper';

// Metrics scale with the font so the font-size search has something to search over; kept out of the
// sibling suite, which pins a fixed glyph width.
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

    it('ignores a minimum above the configured size', () => {
        // Option validation rejects this before it reaches here, so the clamp stays silent.
        const fitted = fitLabelTextAutoSize('abcd', { maxWidth: 40, wrapping: 'never', minimumFontSize: 30 }, font);
        expect(fitted.fontSize).toBeUndefined();
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

describe('fitLabelTextAutoSize with segments', () => {
    // 'ab' is 2 graphemes wide at whatever size it is drawn, so each segment's width is its own font size
    // times 2 — enough to tell a proportional shrink from a uniform one by the widths alone.
    const segments = [
        { text: 'ab', fontSize: 20, minimumFontSize: 10 },
        { text: 'cd', fontSize: 10, minimumFontSize: 5 },
        { text: 'ef', fontSize: 40, minimumFontSize: 20 },
    ] as const;
    const sizesOf = (fitted: AutoSizedLabelText) =>
        (fitted.text as MeasuredSegment[]).map((s) => (s.type === 'image' ? undefined : s.fontSize));

    const fitTo = (maxWidth: number, minimumFontSize?: number, text: readonly object[] = segments) =>
        fitLabelTextAutoSize(text as NormalisedContentSegment[], { maxWidth, wrapping: 'never', minimumFontSize }, {
            ...font,
            fontSize: 20,
        } as const);

    it('keeps every configured size when the text already fits', () => {
        expect(sizesOf(fitTo(1000))).toEqual([20, 10, 40]);
    });

    it('shrinks every segment to the same fraction of its own range', () => {
        // Two graphemes each: the line measures 140px whole, 70px at the floor, so 105px is half way down.
        expect(sizesOf(fitTo(105))).toEqual([15, 7.5, 30]);
    });

    it('bottoms out with every segment at its own minimum', () => {
        expect(sizesOf(fitTo(140))).toEqual([20, 10, 40]);
        expect(sizesOf(fitTo(70))).toEqual([10, 5, 20]);
        expect(sizesOf(fitTo(4))).toEqual([10, 5, 20]);
    });

    it('takes the label minimum for a segment that sets none', () => {
        // The inherited minimum is the label's own value, as an inherited fontSize or fontFamily would be,
        // so the second segment bottoms out at 8 rather than at a size scaled to its own.
        const inheriting = [
            { text: 'ab', fontSize: 20, minimumFontSize: 16 },
            { text: 'cd', fontSize: 40 },
        ];
        expect(sizesOf(fitTo(4, 8, inheriting))).toEqual([16, 8]);
    });

    it('shrinks a segment that only sets a minimum of its own', () => {
        const [oversized] = fitTo(4, undefined, [{ text: 'ab', fontSize: 40, minimumFontSize: 10 }]).text as [
            MeasuredSegment,
        ];
        expect(oversized.type !== 'image' && oversized.fontSize).toBe(10);
    });

    it('does not shrink when no segment and no label sets a minimum', () => {
        const fitted = fitTo(4, undefined, [{ text: 'ab', fontSize: 40 }, { text: 'cd' }]);
        expect(fitted.fontSize).toBeUndefined();
    });
});

describe('labelTextAtShrinkRatio', () => {
    const at = (ratio: number, segment: object) =>
        labelTextAtShrinkRatio([segment] as NormalisedContentSegment[], 10, { ...font, fontSize: 20 }, ratio)
            .text as NormalisedTextSegment[];

    it('scales a lineHeight against the size its own segment is drawn at', () => {
        // The segment takes its 40 from itself and its floor from the label, halving at the mid-point.
        expect(at(0.5, { text: 'ab', fontSize: 40, lineHeight: 30 })[0].lineHeight).toBe(18.75);
        // With no size of its own the segment runs the label's own 20 down to the label's own 10.
        expect(at(0.5, { text: 'ab', minimumFontSize: 10, lineHeight: 30 })[0].lineHeight).toBe(22.5);
    });
});

describe('findLargestFittingFontSize', () => {
    it('probes the configured size before bisecting', () => {
        const probed: number[] = [];
        findLargestFittingFontSize(4, 20, (fontSize) => {
            probed.push(fontSize);
            return fontSize;
        });
        expect(probed).toEqual([20]);
    });

    it('finds the largest whole size between the bounds', () => {
        expect(findLargestFittingFontSize(4, 20, (fontSize) => (fontSize <= 10 ? fontSize : undefined))).toBe(10);
    });

    it('keeps a fractional configured size unrounded', () => {
        expect(findLargestFittingFontSize(8, 12.5, (fontSize) => fontSize)).toBe(12.5);
    });

    it('bottoms out on a fractional minimum rather than the whole size below it', () => {
        // Only the floor is accepted, so a search that bisected to whole sizes alone would either
        // undercut it at 8 or never reach it, and never mark a candidate `atFloor`.
        expect(findLargestFittingFontSize(8.5, 20, (fontSize, atFloor) => (atFloor ? fontSize : undefined))).toBe(8.5);
    });
});

describe('findLargestFontSizeDescending', () => {
    it('agrees with the bisecting search on a monotonic predicate', () => {
        const accepts = (fontSize: number) => (fontSize <= 10 ? fontSize : undefined);
        expect(findLargestFontSizeDescending(4, 20, accepts)).toBe(findLargestFittingFontSize(4, 20, accepts));
    });

    it('finds the largest accepted size where the bisecting search steps past it', () => {
        // Accepted at 18 and at every size below 10, rejected between: the bisection reads the rejected
        // midpoint as "nothing above fits" and settles for 9, where the scan reaches 18.
        const patchy = (fontSize: number) => (fontSize === 18 || fontSize < 10 ? fontSize : undefined);
        expect(findLargestFittingFontSize(4, 20, patchy)).toBe(9);
        expect(findLargestFontSizeDescending(4, 20, patchy)).toBe(18);
    });

    it('marks only the floor as the floor', () => {
        const atFloorSizes: number[] = [];
        findLargestFontSizeDescending(6, 12, (fontSize, atFloor) => {
            if (atFloor) atFloorSizes.push(fontSize);
            return undefined;
        });
        expect(atFloorSizes).toEqual([6]);
    });

    it('probes the configured size alone when the minimum is not below it', () => {
        const probed: number[] = [];
        findLargestFontSizeDescending(20, 12, (fontSize) => {
            probed.push(fontSize);
            return fontSize;
        });
        expect(probed).toEqual([12]);
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
