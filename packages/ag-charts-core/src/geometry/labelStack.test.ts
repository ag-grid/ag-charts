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

    it('truncates wrapped text to the lines a shape holds', () => {
        const wrapped: LabelStackBlock = {
            fit: {
                text: 'Information Technology',
                policy: { overflowStrategy: 'ellipsis', wrapping: 'on-space' },
                font: FONT,
            },
        };
        const oneLineOnly: FitRegion = {
            spanAt: (top, bottom) => (bottom - top <= 20 ? [-80, 80] : [0, 0]),
            extentAbove: 100,
            extentBelow: 100,
        };
        const fitted = fitLabelStack(stack(wrapped), undefined, oneLineOnly);
        expect(fitted?.blocks[0]?.text).toBe('Information Tec…');
    });

    it('keeps the wider single line when narrowing to fit wrapped lines would truncate more', () => {
        const wrapped: LabelStackBlock = {
            fit: {
                text: 'Information Technology Services',
                policy: { overflowStrategy: 'ellipsis', wrapping: 'on-space' },
                font: FONT,
            },
        };
        const narrowsWithHeight: FitRegion = {
            spanAt: (top, bottom) => {
                if (bottom - top <= 20) return [-80, 80];
                return bottom - top <= 60 ? [-30, 30] : [0, 0];
            },
            extentAbove: 100,
            extentBelow: 100,
        };
        const fitted = fitLabelStack(stack(wrapped), undefined, narrowsWithHeight);
        expect(fitted?.blocks[0]?.text).toBe('Information Tec…');
    });
});
