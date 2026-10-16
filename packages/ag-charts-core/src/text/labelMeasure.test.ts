import { describe, expect, it, vi } from 'vitest';

import { type LabelMeasureContext, measurePlacedLabel } from './labelMeasure';

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

describe('measurePlacedLabel', () => {
    const ctx: LabelMeasureContext = {
        labelPadding: { top: 0, right: 0, bottom: 0, left: 0 },
        labelTextMeasurer: { measureLines: (text) => ({ width: 10, height: text.split('\n').length * 20 }) },
        labelFit: undefined,
    };

    it('measures a multi-line label by its lineHeight rather than the configured measurer', () => {
        expect(measurePlacedLabel('A\nB', { fontSize: 10 }, ctx).height).toBe(40);
        expect(measurePlacedLabel('A\nB', { fontSize: 10, lineHeight: 60 }, ctx).height).toBe(120);
    });
});
