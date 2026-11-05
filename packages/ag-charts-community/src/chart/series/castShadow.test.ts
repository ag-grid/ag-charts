import { afterEach, describe, expect, it, vi } from 'vitest';

import { Color, Rect } from 'ag-charts-core';
import type { NormalisedDropShadowOptions } from 'ag-charts-core';

import { setupMockCanvas } from '../test/utils';

const GLOW: NormalisedDropShadowOptions = { enabled: true, fillOpacity: 0.4, xOffset: 0, yOffset: 0, blur: 2 };

const glowingRect = (fill: string | undefined, stroke?: string) => {
    const rect = new Rect();
    rect.fill = fill;
    rect.stroke = stroke;
    rect.fillShadow = GLOW;
    return rect;
};

describe('Shape.getCastShadow', () => {
    setupMockCanvas();

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('casts a glow with no fill in the fill of the shape', () => {
        expect(glowingRect('#ff0000').getCastShadow()).toMatchObject({ ...GLOW, fill: '#ff0000' });
    });

    it('casts in the stroke where the shape has no fill, and nothing where it has neither', () => {
        expect(glowingRect(undefined, '#0000ff').getCastShadow()?.fill).toBe('#0000ff');
        expect(glowingRect('none', '#0000ff').getCastShadow()?.fill).toBe('#0000ff');
        expect(glowingRect(undefined).getCastShadow()).toBeUndefined();
        expect(glowingRect('none', 'transparent').getCastShadow()).toBeUndefined();
    });

    it('keeps the shadow until the shadow or the paint changes', () => {
        const rect = glowingRect('#ff0000');
        const shadow = rect.getCastShadow();
        expect(rect.getCastShadow()).toBe(shadow);

        rect.fill = '#00ff00';
        const recoloured = rect.getCastShadow();
        expect(recoloured).not.toBe(shadow);
        expect(recoloured?.fill).toBe('#00ff00');
        expect(rect.getCastShadow()).toBe(recoloured);

        rect.fillShadow = { ...GLOW, blur: 6 };
        expect(rect.getCastShadow()).toMatchObject({ blur: 6, fill: '#00ff00' });

        rect.fillOpacity = 0;
        rect.stroke = '#0000ff';
        expect(rect.getCastShadow()?.fill).toBe('#0000ff');
    });

    it('keeps a shadow that casts nothing, too', () => {
        const rect = glowingRect('none');
        const parse = vi.spyOn(Color, 'fromString');
        expect(rect.getCastShadow()).toBeUndefined();
        expect(rect.getCastShadow()).toBeUndefined();
        expect(parse).not.toHaveBeenCalled();
    });

    it('reads each colour once, however many shapes and frames it is cast by', () => {
        const rects = Array.from({ length: 20 }, () => glowingRect('rgb(12, 34, 56)'));
        const parse = vi.spyOn(Color, 'fromString');

        for (let frame = 0; frame < 5; frame++) {
            for (const rect of rects) rect.getCastShadow();
        }
        expect(parse.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('returns a shadow of its own with a fill as it is', () => {
        const rect = glowingRect('#ff0000');
        const shadow = { ...GLOW, fill: '#123456' };
        rect.fillShadow = shadow;
        expect(rect.getCastShadow()).toBe(shadow);
    });
});
