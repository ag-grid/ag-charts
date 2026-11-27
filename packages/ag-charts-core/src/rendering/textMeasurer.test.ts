import { afterEach, describe, expect, it, vi } from 'vitest';

import { cachedTextMeasurer } from './textMeasurer';

const { measureText } = vi.hoisted(() => ({
    measureText: vi.fn((text: string) => ({
        width: [...text].length * 10,
        fontBoundingBoxAscent: 16,
        fontBoundingBoxDescent: 4,
        emHeightAscent: 16,
        emHeightDescent: 4,
    })),
}));

vi.mock('./canvasUtil', () => ({
    createCanvasContext: () => ({ font: '', measureText }),
}));

describe('cachedTextMeasurer', () => {
    afterEach(() => {
        cachedTextMeasurer.clear();
        measureText.mockClear();
    });

    it('measures a string once however often its width is asked for', () => {
        const measurer = cachedTextMeasurer({ fontSize: 12, fontFamily: 'cached-width' });
        expect(measurer.textWidth('Hello')).toBe(50);
        expect(measurer.textWidth('Hello')).toBe(50);
        expect(measureText.mock.calls.filter(([text]) => text === 'Hello')).toHaveLength(1);
    });

    it('measures a single character once however often its width is asked for', () => {
        const measurer = cachedTextMeasurer({ fontSize: 12, fontFamily: 'cached-width' });
        expect(measurer.textWidth('H')).toBe(10);
        expect(measurer.textWidth('H')).toBe(10);
        expect(measureText.mock.calls.filter(([text]) => text === 'H')).toHaveLength(1);
    });

    it('keeps measuring every string once when its metrics cache fills and clears', () => {
        const measurer = cachedTextMeasurer({ fontSize: 12, fontFamily: 'cached-metrics' });
        for (let i = 0; i <= 10_000; i += 1) measurer.measureText(`t${i}`);
        expect(measurer.measureText('t10000').width).toBe(60);
        expect(measureText.mock.calls.filter(([text]) => text === 't10000')).toHaveLength(1);
        expect(measurer.measureText('t0').width).toBe(20);
        expect(measureText.mock.calls.filter(([text]) => text === 't0')).toHaveLength(2);
    });

    it('shares a measurer between equal font options and not between different ones', () => {
        const regular = cachedTextMeasurer({ fontSize: 12, fontFamily: 'shared' });
        expect(cachedTextMeasurer({ fontSize: 12, fontFamily: 'shared' })).toBe(regular);
        expect(cachedTextMeasurer('12px shared')).toBe(regular);
        for (const changed of [
            { fontSize: 13, fontFamily: 'shared' },
            { fontSize: 12, fontFamily: 'other' },
            { fontSize: 12, fontFamily: 'shared', fontWeight: 'bold' as const },
            { fontSize: 12, fontFamily: 'shared', fontStyle: 'italic' as const },
        ]) {
            expect(cachedTextMeasurer(changed)).not.toBe(regular);
            expect(cachedTextMeasurer({ fontSize: 12, fontFamily: 'shared' })).toBe(regular);
        }
    });

    it('builds a new measurer for a font asked for again after a clear', () => {
        const before = cachedTextMeasurer({ fontSize: 12, fontFamily: 'cleared' });
        cachedTextMeasurer.clear();
        expect(cachedTextMeasurer({ fontSize: 12, fontFamily: 'cleared' })).not.toBe(before);
    });
});
