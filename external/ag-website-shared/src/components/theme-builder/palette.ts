/**
 * The series palette: an ordered list of fill/stroke pairs, plus the three
 * financial accents.
 *
 * This lives in the host-agnostic layer because both products that have a chart
 * palette reduce to the same structure, even though they store it differently:
 *
 * - AG Charts carries it as `AgChartTheme.palette`, a sibling of `params`, with
 *   `fills` and `strokes` as index-paired arrays.
 * - Studio flattens the same information into numbered theme params
 *   (`chartPaletteFills1Color` ... `chartPaletteStrokes20Color`, plus
 *   `chartPalette{Up,Down,Neutral}{Fill,Stroke}Color`) and reassembles them into
 *   an `AgChartThemePalette` at runtime.
 *
 * So the shape, the transforms and the editor are shared, and each host adapts
 * at its own boundary: charts to and from its palette object, Studio to and from
 * its numbered params.
 *
 * Colours are plain strings here. AG Charts' `fills` also admits gradients and
 * patterns, but a colour picker cannot edit one, so hosts narrow at the boundary
 * rather than the editor having to defend against a value it cannot display.
 */

export interface PaletteAccent {
    fill?: string;
    stroke?: string;
}

export type PaletteAccentKey = 'up' | 'down' | 'neutral';

export const PALETTE_ACCENT_KEYS: PaletteAccentKey[] = ['up', 'down', 'neutral'];

export interface Palette {
    fills: string[];
    strokes: string[];
    up?: PaletteAccent;
    down?: PaletteAccent;
    neutral?: PaletteAccent;
}

/** "No palette of our own" - the host falls back to its base theme's colours. */
export const EMPTY_PALETTE: Palette = { fills: [], strokes: [] };

/**
 * Fills and strokes are index-paired, so the editor works in series slots rather
 * than in two parallel lists: adding or removing a slot keeps the pair together,
 * which is what a user expects and what the two arrays silently rely on.
 */
export interface SeriesColor {
    fill: string;
    stroke: string;
}

export const toSeriesColors = ({ fills, strokes }: Palette): SeriesColor[] =>
    fills.map((fill, index) => ({ fill, stroke: strokes[index] ?? fill }));

export const fromSeriesColors = (palette: Palette, colors: SeriesColor[]): Palette => ({
    ...palette,
    fills: colors.map(({ fill }) => fill),
    strokes: colors.map(({ stroke }) => stroke),
});

export const withAccentColors = (palette: Palette, key: PaletteAccentKey, value: PaletteAccent): Palette => ({
    ...palette,
    [key]: value,
});

export const paletteIsEmpty = (palette: Palette): boolean =>
    palette.fills.length === 0 && palette.strokes.length === 0 && !palette.up && !palette.down && !palette.neutral;
