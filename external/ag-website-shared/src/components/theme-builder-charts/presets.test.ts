import { describe, expect, it } from 'vitest';

import { PRESETS, paletteFor, toSharedPreset } from './presets';

describe('charts theme builder presets', () => {
    it('never changes the chart layout', () => {
        // A preset proposes an appearance, not a shape. ag-financial sets
        // chartPadding: 0, and letting that through made one card resize the
        // preview when it was picked.
        for (const preset of PRESETS) {
            for (const isDark of [false, true]) {
                const { params } = toSharedPreset(preset, isDark);
                expect(Object.keys(params ?? {}), `${preset.id} (${isDark ? 'dark' : 'light'})`).not.toContain(
                    'chartPadding'
                );
            }
        }
    });

    it('still carries the colour params that make a theme distinctive', () => {
        // The counterweight to the filter above: ag-financial's other change is
        // a lighter gridLineColor, and dropping that with chartPadding would
        // make the preset a palette swap and nothing else.
        const financial = PRESETS.find((preset) => preset.id === 'financial')!;
        expect(Object.keys(toSharedPreset(financial, false).params ?? {})).toContain('gridLineColor');
    });

    it('gives every preset a palette in both modes', () => {
        for (const preset of PRESETS) {
            for (const isDark of [false, true]) {
                const palette = paletteFor(preset, isDark);
                expect(palette.fills.length, `${preset.id}`).toBeGreaterThan(0);
                expect(palette.strokes).toHaveLength(palette.fills.length);
            }
        }
    });

    it('keeps lookalike themes apart in the row', () => {
        // Default, Material and Vivid share a hue sequence and differ mainly in
        // saturation, so the order interleaves them with the distinctive ones.
        const lookalikes = ['default', 'material', 'vivid'];
        const positions = PRESETS.map((preset, index) => ({ id: preset.id, index })).filter(({ id }) =>
            lookalikes.includes(id)
        );
        for (let i = 1; i < positions.length; i++) {
            expect(positions[i].index - positions[i - 1].index).toBeGreaterThan(1);
        }
    });
});
