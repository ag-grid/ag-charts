import { describe, expect, it } from 'vitest';

import { type LabelFit, type NormalisedTextOrSegments, fitLabelText, resolveLabelFit } from 'ag-charts-core';
import type { TextWrap } from 'ag-charts-types';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { setupMockConsole } from '../util/test/mockConsole';
import { fitLabelToContainer, insideMarkerContainer } from './labelUtil';

const ELLIPSIS = '…';
const FONT = { fontFamily: 'Verdana', fontSize: 15 };
const LONG_TEXT = 'A very long label that will not fit';

// Resolve the fit the way a series does before fitting, so the tests exercise the same path as production.
function fitToContainer(
    text: NormalisedTextOrSegments,
    fit: { maxWidth?: number; maxHeight?: number; wrapping?: TextWrap; truncate?: boolean; avoid?: boolean },
    container: { width: number; height: number } | undefined
) {
    const { avoid = false, ...fitFields } = fit;
    return fitLabelToContainer(text, resolveLabelFit(fitFields, avoid), FONT, container);
}

describe('fitLabelToContainer', () => {
    setupMockConsole();
    setupMockCanvas();

    it('returns the text unchanged when the policy resolves to show (no truncate, no avoidance)', () => {
        expect(fitToContainer(LONG_TEXT, { maxWidth: 30 }, { width: 30, height: 100 })).toBe(LONG_TEXT);
        expect(fitToContainer(LONG_TEXT, {}, { width: 10, height: 10 })).toBe(LONG_TEXT);
    });

    it('clips to the container when no explicit bound is set', () => {
        const result = fitToContainer(LONG_TEXT, { truncate: true }, { width: 40, height: 100 });
        expect(result).not.toBe(LONG_TEXT);
        expect(result).toContain(ELLIPSIS);
    });

    it('behaves like explicit-only fit when no container is supplied', () => {
        expect(fitToContainer(LONG_TEXT, { maxWidth: 40, truncate: true }, undefined)).toBe(
            fitLabelText(
                LONG_TEXT,
                { maxWidth: 40, maxHeight: undefined, wrapping: undefined, overflowStrategy: 'ellipsis' },
                FONT
            )
        );
    });

    it('applies the explicit bound when it is tighter than the container', () => {
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitToContainer(LONG_TEXT, { maxWidth: 40, truncate: true }, { width: 400, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('applies the container bound when it is tighter than the explicit bound', () => {
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitToContainer(LONG_TEXT, { maxWidth: 400, truncate: true }, { width: 40, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('threads wrapping and truncate through to the fit', () => {
        const result = fitToContainer(
            'one two three four',
            { wrapping: 'on-space', truncate: true },
            {
                width: 60,
                height: 400,
            }
        );
        expect(typeof result).toBe('string');
        // on-space wrapping breaks the label across multiple lines within the narrow container.
        expect(String(result)).toContain('\n');
    });

    it('resolves collision avoidance to a hide overflow', () => {
        const expected: LabelFit = { maxWidth: 30, maxHeight: 100, wrapping: undefined, overflowStrategy: 'hide' };
        expect(fitToContainer(LONG_TEXT, { avoid: true }, { width: 30, height: 100 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('preserves rich-text segments as an array', () => {
        const segments = [{ type: 'text' as const, text: LONG_TEXT }];
        const result = fitToContainer(segments, { truncate: true }, { width: 40, height: 100 });
        expect(Array.isArray(result)).toBe(true);
    });
});

describe('insideMarkerContainer', () => {
    setupMockConsole();
    setupMockCanvas();

    it('returns the largest square inscribed in the marker circle', () => {
        const { width, height } = insideMarkerContainer(20);
        expect(width).toBeCloseTo(20 / Math.SQRT2);
        expect(height).toBeCloseTo(20 / Math.SQRT2);
        // The square's diagonal equals the marker diameter, so its corners lie on the circle.
        expect(Math.hypot(width, height)).toBeCloseTo(20);
    });

    it('scales the analysed shape rectangle by the marker diameter', () => {
        const small = insideMarkerContainer(50, 'square');
        const large = insideMarkerContainer(100, 'square');
        expect(large.width).toBeCloseTo(small.width * 2);
        expect(large.height).toBeCloseTo(small.height * 2);
        // A square marker uses almost its whole box.
        expect(large.width).toBeGreaterThan(90);
    });

    it('gives a heart a wide, short box and a diamond a smaller near-square one', () => {
        const heart = insideMarkerContainer(100, 'heart');
        const diamond = insideMarkerContainer(100, 'diamond');
        expect(heart.width).toBeGreaterThan(heart.height * 2);
        expect(diamond.width).toBeGreaterThan(40);
        expect(diamond.width).toBeLessThan(60);
    });

    it('falls back to the inscribed square for an unanalysable (empty) custom shape', () => {
        const side = 20 / Math.SQRT2;
        expect(insideMarkerContainer(20, () => {}).width).toBeCloseTo(side);
        expect(insideMarkerContainer(20).width).toBeCloseTo(side);
    });

    it('collapses to an empty container for a markerless point', () => {
        expect(insideMarkerContainer(0)).toEqual({ width: 0, height: 0 });
    });

    it('hides an inside label that overflows a small marker', () => {
        const result = fitToContainer(LONG_TEXT, { avoid: true }, insideMarkerContainer(12));
        expect(result).toBe('');
    });
});
