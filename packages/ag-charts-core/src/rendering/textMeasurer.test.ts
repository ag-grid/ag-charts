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
});
