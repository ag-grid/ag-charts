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
import { RGBAColor } from '../../theming/RGBAColor';

export interface PaletteAccent {
    fill?: string;
    stroke?: string;
    /** As `Palette.strokesDerived`, for this one pair. */
    strokeDerived?: boolean;
}

export type PaletteAccentKey = 'up' | 'down' | 'neutral';

export const PALETTE_ACCENT_KEYS: PaletteAccentKey[] = ['up', 'down', 'neutral'];

export interface Palette {
    fills: string[];
    strokes: string[];
    /**
     * Which strokes follow their fill rather than having been chosen, paired by
     * index with `strokes`.
     *
     * "Follows" is about where the next value comes from, not what the current
     * one is: a slot can be derived and still show a hand-picked colour, which
     * is exactly what a stock theme's palette is. Only when the fill changes is
     * the stroke replaced - so the stock strokes, which are hand-tuned rather
     * than computed, survive until the fill they were tuned for is gone.
     *
     * Optional, and absent means derived: a palette stored before this existed,
     * or assembled by a host that cannot carry it, gets the behaviour that
     * needs no maintenance rather than a set of strokes that quietly go stale.
     */
    strokesDerived?: boolean[];
    /**
     * Whether the strokes are used at all.
     *
     * Optional, and absent means enabled, so a palette stored before this
     * existed keeps the strokes it was built with.
     *
     * The strokes themselves are kept while this is off rather than cleared:
     * switching it back on is meant to return what the user had, and a palette
     * that forgot its strokes the moment they were hidden would be a trap.
     */
    strokesEnabled?: boolean;
    up?: PaletteAccent;
    down?: PaletteAccent;
    neutral?: PaletteAccent;
}

/**
 * How much of a fill's lightness a derived stroke keeps.
 *
 * Chosen against AG Charts' own palettes rather than picked: scaling HSL
 * lightness by this reproduces the ten hand-tuned `ag-default` strokes more
 * closely than any other simple rule tried (darkening by a fixed amount, or
 * scaling the RGB channels), and being a scale rather than a subtraction it has
 * no floor to clamp against - a dark fill simply yields a slightly darker
 * stroke instead of collapsing to black.
 */
const DERIVED_STROKE_LIGHTNESS = 0.6;

/** Components in 0..1, hue included. */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const chroma = max - min;
    if (chroma === 0) return [0, 0, lightness];

    let hue;
    if (max === r) {
        hue = ((g - b) / chroma) % 6;
    } else if (max === g) {
        hue = (b - r) / chroma + 2;
    } else {
        hue = (r - g) / chroma + 4;
    }
    hue /= 6;
    if (hue < 0) hue += 1;

    return [hue, chroma / (1 - Math.abs(2 * lightness - 1)), lightness];
};

const hslToRgb = (hue: number, saturation: number, lightness: number): [number, number, number] => {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const second = chroma * (1 - Math.abs(((hue * 6) % 2) - 1));
    const offset = lightness - chroma / 2;
    const sector = Math.floor(hue * 6) % 6;
    const [r, g, b] = [
        [chroma, second, 0],
        [second, chroma, 0],
        [0, chroma, second],
        [0, second, chroma],
        [second, 0, chroma],
        [chroma, 0, second],
    ][sector];
    return [r + offset, g + offset, b + offset];
};

/**
 * The stroke a fill implies: the same colour, darker.
 *
 * A fill this cannot parse is returned unchanged rather than guessed at. The
 * editor coerces every colour it stores to hex, so that is a `var()` or a
 * gradient reaching a code path built for neither - and a stroke the same colour
 * as its fill is a stroke nobody notices, which is the right way to fail here.
 */
export const deriveStroke = (fill: string): string => {
    const color = RGBAColor.parseCss(fill);
    if (!color) return fill;
    const [hue, saturation, lightness] = rgbToHsl(color.r, color.g, color.b);
    const [r, g, b] = hslToRgb(hue, saturation, lightness * DERIVED_STROKE_LIGHTNESS);
    return new RGBAColor(r, g, b, color.a).toCSSHex();
};

/** No fill to derive from leaves the stroke unset rather than inventing one. */
const deriveAccentStroke = (fill: string | undefined) => (fill ? deriveStroke(fill) : undefined);

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
    /** Optional so a caller building a palette from scratch can leave it to the default. */
    strokeDerived?: boolean;
}

/** Absent means derived - see `Palette.strokesDerived`. */
export const strokeIsDerived = (derived: boolean | undefined): boolean => derived ?? true;

/** Absent means enabled - see `Palette.strokesEnabled`. */
export const strokesAreEnabled = (palette: Palette): boolean => palette.strokesEnabled ?? true;

export const withStrokesEnabled = (palette: Palette, enabled: boolean): Palette => ({
    ...palette,
    strokesEnabled: enabled,
});

export const toSeriesColors = ({ fills, strokes, strokesDerived }: Palette): SeriesColor[] =>
    fills.map((fill, index) => ({
        fill,
        stroke: strokes[index] ?? deriveStroke(fill),
        strokeDerived: strokeIsDerived(strokesDerived?.[index]),
    }));

export const fromSeriesColors = (palette: Palette, colors: SeriesColor[]): Palette => ({
    ...palette,
    fills: colors.map(({ fill }) => fill),
    strokes: colors.map(({ stroke }) => stroke),
    strokesDerived: colors.map(({ strokeDerived }) => strokeIsDerived(strokeDerived)),
});

/**
 * A slot with its fill replaced, and its stroke too where the stroke was only
 * ever following the fill.
 *
 * Here rather than in the editor because it is the rule the model is for: a
 * derived stroke that did not move with its fill would be the stale pairing
 * this whole flag exists to prevent.
 */
export const withFill = (color: SeriesColor, fill: string): SeriesColor => ({
    ...color,
    fill,
    stroke: strokeIsDerived(color.strokeDerived) ? deriveStroke(fill) : color.stroke,
});

/** A slot with a stroke the user chose, which is what stops it following the fill. */
export const withStroke = (color: SeriesColor, stroke: string): SeriesColor => ({
    ...color,
    stroke,
    strokeDerived: false,
});

/**
 * A slot linked back to its fill, or cut loose from it.
 *
 * Linking recomputes immediately rather than waiting for the next fill edit:
 * a control that visibly changes nothing reads as broken, and the recomputed
 * colour is the only way to show what "derived" means.
 */
export const withDerivedStroke = (color: SeriesColor, derived: boolean): SeriesColor => ({
    ...color,
    strokeDerived: derived,
    stroke: derived ? deriveStroke(color.fill) : color.stroke,
});

/** The same three rules, for an accent pair, whose colours may both be unset. */
export const withAccentFill = (accent: PaletteAccent | undefined, fill: string | undefined): PaletteAccent => ({
    ...accent,
    fill,
    stroke: strokeIsDerived(accent?.strokeDerived) ? deriveAccentStroke(fill) : accent?.stroke,
});

export const withAccentStroke = (accent: PaletteAccent | undefined, stroke: string | undefined): PaletteAccent => ({
    ...accent,
    stroke,
    strokeDerived: false,
});

export const withDerivedAccentStroke = (accent: PaletteAccent | undefined, derived: boolean): PaletteAccent => ({
    ...accent,
    strokeDerived: derived,
    stroke: derived ? deriveAccentStroke(accent?.fill) : accent?.stroke,
});

export const withAccentColors = (palette: Palette, key: PaletteAccentKey, value: PaletteAccent): Palette => ({
    ...palette,
    [key]: value,
});

/**
 * The palette as AG Charts takes it, without the editor's own bookkeeping.
 *
 * `strokesDerived`, `strokesEnabled` and an accent's `strokeDerived` describe
 * where the next stroke comes from and whether strokes are wanted at all, which
 * are questions for the editor and not for a chart, so they are projected out
 * rather than passed along with everything else. Hosts must go through this on
 * the way to a theme - the shape is otherwise a structural subset of
 * `AgChartThemePalette`, and an extra key would ride along unnoticed into the
 * theme a user copies.
 */
export const toThemePalette = (palette: Palette) => {
    const { fills, strokes, up, down, neutral } = palette;
    const enabled = strokesAreEnabled(palette);
    return {
        fills,
        // Strokes off is expressed as a stroke matching its fill, because an AG
        // Charts palette has no way to say "no stroke": dropping `strokes`
        // inherits the base theme's, which is worse than an unwanted outline -
        // a red fill ringed in the default navy. Matching also covers the
        // series that outline themselves whatever the chart asks for - box
        // plot, candlestick, treemap groups - which an unset stroke width
        // would not.
        strokes: enabled ? strokes : [...fills],
        ...(up ? { up: toThemeAccent(up, enabled) } : {}),
        ...(down ? { down: toThemeAccent(down, enabled) } : {}),
        ...(neutral ? { neutral: toThemeAccent(neutral, enabled) } : {}),
    };
};

const toThemeAccent = ({ fill, stroke }: PaletteAccent, strokesEnabled: boolean) => ({
    fill,
    stroke: strokesEnabled ? stroke : fill,
});

/**
 * A stored palette, with anything it has no opinion on taken from another.
 *
 * The financial colours are why this exists. A palette carrying none of `up`,
 * `down` or `neutral` is an *indexed* palette to AG Charts, which draws rising
 * candles hollow - transparent fill, the outline doing the whole job - so a
 * record written before those rows existed leaves three blank swatches in the
 * editor and a candlestick that empties out the moment its stroke is switched
 * off.
 *
 * Absent, not empty: a colour the user has cleared is stored as an accent with
 * no fill in it, which is an opinion, and stays cleared.
 */
export const withPaletteDefaults = (palette: Palette, defaults: Palette): Palette => ({ ...defaults, ...palette });

export const paletteIsEmpty = (palette: Palette): boolean =>
    palette.fills.length === 0 && palette.strokes.length === 0 && !palette.up && !palette.down && !palette.neutral;
