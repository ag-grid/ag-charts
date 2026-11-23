import { describe, expect, it, vi } from 'vitest';

import type { ContentSegment } from 'ag-charts-types';

import type { FitRegion } from './fitRegion';
import { type LabelStack, type LabelStackBlock, fitLabelStack } from './labelStack';

// jsdom has no canvas, so cachedTextMeasurer's real createCanvasContext throws. Every character is 10px
// wide and every line 20px tall.
vi.mock('../rendering/canvasUtil', () => ({
    createCanvasContext: () => ({
        font: '',
        measureText: (text: string) => ({
            width: [...text].length * 10,
            fontBoundingBoxAscent: 16,
            fontBoundingBoxDescent: 4,
            emHeightAscent: 16,
            emHeightDescent: 4,
        }),
    }),
}));

const FONT = { fontSize: 12, fontFamily: 'sans-serif' };

const block = (text: LabelStackBlock['fit']['text'], optional?: boolean): LabelStackBlock => ({
    fit: { text, policy: { overflowStrategy: 'ellipsis' }, font: FONT },
    optional,
});

const stack = (...blocks: LabelStackBlock[]): LabelStack => ({ blocks, spacing: 0 });

describe('fitLabelStack', () => {
    it('fits every block whole when the room holds them', () => {
        const fitted = fitLabelStack(stack(block('Apple'), block('$383B', true)), { width: 100, height: 100 });
        expect(fitted?.blocks.map((b) => b?.text)).toEqual(['Apple', '$383B']);
        expect(fitted?.dropped).toBe(0);
    });

    it('drops an optional block rather than leaving the stack too tall', () => {
        const fitted = fitLabelStack(stack(block('Apple'), block('$383B', true)), { width: 100, height: 30 });
        expect(fitted?.blocks.map((b) => b?.text)).toEqual(['Apple', undefined]);
    });

    it('measures blocks by their lineHeight', () => {
        const tall = (text: string): LabelStackBlock => ({
            fit: { text, policy: { overflowStrategy: 'ellipsis' }, font: { ...FONT, lineHeight: 40 } },
        });
        const fitted = fitLabelStack(stack(tall('Apple'), tall('$383B')), { width: 100, height: 100 });
        expect(fitted?.blocks.map((b) => b?.height)).toEqual([40, 40]);
        expect(fitted?.height).toBe(80);
    });

    it('drops a block truncated to a bare ellipsis', () => {
        expect(fitLabelStack(stack(block('Netflix')), { width: 15, height: 100 })).toBeUndefined();
    });

    it('keeps a block whose text is truncated away but whose image still fits', () => {
        const segments: ContentSegment[] = [
            { type: 'image', url: 'https://example.com/logo.png', width: 30, height: 20, block: true },
            { text: 'Netflix' },
        ];
        const fitted = fitLabelStack(stack(block(segments)), { width: 40, height: 100 });
        const kept = fitted?.blocks[0]?.text;
        expect(Array.isArray(kept) && kept.some((segment) => segment.type === 'image')).toBe(true);
    });

    describe('in a shape that narrows as the stack grows taller', () => {
        const wrapped = (text: string): LabelStackBlock => ({
            fit: { text, policy: { overflowStrategy: 'ellipsis', wrapping: 'on-space' }, font: FONT },
        });
        // Half-widths by the number of 20px lines the stack spans.
        const narrowing = (...halfWidths: number[]): FitRegion => ({
            spanAt: (top, bottom) => {
                const half = halfWidths[Math.ceil((bottom - top) / 20) - 1] ?? 0;
                return [-half, half];
            },
            extentAbove: 100,
            extentBelow: 100,
        });

        it.each([
            { text: 'Information Technology Services', halfWidths: [80, 30, 30], expected: 'Information…' },
            { text: 'Alpha Bravo Delta', halfWidths: [80, 50, 20], expected: 'Alpha Bravo…' },
        ])('keeps the wider line when narrowing would drop more of "$text"', ({ text, halfWidths, expected }) => {
            const fitted = fitLabelStack(stack(wrapped(text)), undefined, narrowing(...halfWidths));
            expect(fitted?.blocks[0]?.text).toBe(expected);
        });

        it('keeps the line of a later block when holding the wider line', () => {
            const blocks = stack(wrapped('Information Technology Services'), wrapped('Alpha'));
            const fitted = fitLabelStack(blocks, undefined, narrowing(80, 80, 30, 30));
            expect(fitted?.blocks.map((b) => b?.text)).toEqual(['Information…', 'Alpha']);
        });

        it('keeps an image rather than holding more of the text without it', () => {
            const withLogo: LabelStackBlock = {
                fit: {
                    text: [
                        { type: 'image', url: 'https://example.com/logo.png', width: 30, height: 40, block: true },
                        { text: 'Information Technology Services' },
                    ],
                    policy: { overflowStrategy: 'ellipsis', wrapping: 'on-space' },
                    font: FONT,
                },
            };
            const fitted = fitLabelStack(stack(withLogo), undefined, narrowing(100, 60, 60, 40));
            expect(fitted?.blocks[0]?.text).toMatchObject([{ type: 'image' }, { text: 'Inform…' }]);
        });
    });
});
