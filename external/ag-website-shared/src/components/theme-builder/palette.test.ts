import { describe, expect, it } from 'vitest';

import {
    EMPTY_PALETTE,
    type Palette,
    fromSeriesColors,
    paletteIsEmpty,
    toSeriesColors,
    withAccentColors,
} from './palette';

const palette: Palette = {
    fills: ['#aaa', '#bbb'],
    strokes: ['#111', '#222'],
    up: { fill: '#0f0', stroke: '#0a0' },
};

describe('toSeriesColors', () => {
    it('pairs each fill with the stroke at the same index', () => {
        expect(toSeriesColors(palette)).toEqual([
            { fill: '#aaa', stroke: '#111' },
            { fill: '#bbb', stroke: '#222' },
        ]);
    });

    it('falls back to the fill when a stroke is missing', () => {
        // A host with independent fill and stroke slots can leave the arrays
        // ragged; the editor still has to render a stroke picker for every row.
        expect(toSeriesColors({ fills: ['#aaa', '#bbb'], strokes: ['#111'] })).toEqual([
            { fill: '#aaa', stroke: '#111' },
            { fill: '#bbb', stroke: '#bbb' },
        ]);
    });
});

describe('fromSeriesColors', () => {
    it('splits slots back into index-paired arrays', () => {
        const next = fromSeriesColors(palette, [{ fill: '#ccc', stroke: '#333' }]);
        expect(next.fills).toEqual(['#ccc']);
        expect(next.strokes).toEqual(['#333']);
    });

    it('leaves the accents untouched', () => {
        expect(fromSeriesColors(palette, []).up).toEqual({ fill: '#0f0', stroke: '#0a0' });
    });

    it('round-trips a palette unchanged', () => {
        expect(fromSeriesColors(palette, toSeriesColors(palette))).toEqual(palette);
    });
});

describe('withAccentColors', () => {
    it('replaces one accent and keeps the rest', () => {
        const next = withAccentColors(palette, 'down', { fill: '#f00' });
        expect(next.down).toEqual({ fill: '#f00' });
        expect(next.up).toEqual(palette.up);
        expect(next.fills).toEqual(palette.fills);
    });
});

describe('paletteIsEmpty', () => {
    it('is true only when nothing is set', () => {
        expect(paletteIsEmpty(EMPTY_PALETTE)).toBe(true);
        expect(paletteIsEmpty(palette)).toBe(false);
        expect(paletteIsEmpty({ ...EMPTY_PALETTE, neutral: { fill: '#888' } })).toBe(false);
    });
});
