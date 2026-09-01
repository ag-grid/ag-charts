import { type Palette, paletteIsEmpty, toThemePalette } from '@ag-website-shared/components/theme-builder/palette';
import type { AgChartTheme, AgChartThemeName, AgChartThemePalette, AgChartThemeParams } from 'ag-charts-community';

/**
 * The outbound half of the shadow-theme adapter (see `chartsTheme.ts`): turn the
 * builder's ag-stack-shaped param values back into an `AgChartTheme` that the
 * preview chart - and the user's copied snippet - can actually consume.
 *
 * The two formats were designed to line up: colour references are `{ ref, mix,
 * onto }` on both sides, borders are `{ width, color }`, and a font family is
 * `{ googleFont }`. Only two things genuinely differ, both handled below.
 */

/** `"4px"` -> `4`. AG Charts takes plain numbers for pixel lengths. */
const toPixelSize = (value: string): number | string => {
    const match = /^(-?[\d.]+)px$/.exec(value.trim());
    return match ? parseFloat(match[1]) : value;
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value != null && !Array.isArray(value);

const LENGTH_SUFFIXES = ['Radius', 'Width', 'Size', 'Padding', 'Spacing'];
const isLengthParam = (property: string) => LENGTH_SUFFIXES.some((suffix) => property.endsWith(suffix));

const toChartParamValue = (property: string, value: unknown): unknown => {
    if (value == null) return value;

    if (property.toLowerCase().endsWith('fontfamily')) {
        // Untouched, `{ googleFont }` included: AG Charts reads that form itself
        // and imports the family, so unwrapping it to the bare name would leave
        // the pasted theme naming a font the user's page never loads. A stack,
        // a plain name and a `{ ref }` are all valid here too.
        return value;
    }

    if (typeof value === 'string' && isLengthParam(property)) {
        return toPixelSize(value);
    }

    if (isPlainObject(value)) {
        // A colour reference passes straight through; a border is a composite
        // whose members need the same treatment. `style` has no AG Charts
        // equivalent, so it is dropped rather than emitted as an unknown key.
        if ('ref' in value) return value;
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'style')
                .map(([key, member]) => [key, toChartParamValue(key === 'width' ? `${key}Width` : key, member)])
        );
    }

    return value;
};

/**
 * Convert the builder's overridden params into `AgChartTheme.params`, dropping
 * any the user has not set so the snippet only carries real customisations.
 */
const toChartThemeParams = (overriddenParams: Record<string, unknown>): AgChartThemeParams =>
    Object.fromEntries(
        Object.entries(overriddenParams)
            .filter(([, value]) => value != null)
            .map(([property, value]) => [property, toChartParamValue(property, value)])
    ) as AgChartThemeParams;

/**
 * The theme shape this tool produces: a base theme, params and a palette, and
 * nothing else.
 *
 * `overrides` is dropped rather than left optional because it is the only part
 * of a theme that carries a datum context, and `AgChartTheme` is invariant in
 * that context - so a theme typed with one cannot be handed to both a plain
 * chart and the price-volume preset, which pins the context to `never`. The
 * builder emits no overrides, so saying so in the type costs nothing and lets
 * one theme drive both previews.
 */
export type ChartsTheme = Omit<AgChartTheme, 'overrides'>;

export type ChartsThemeSelection = {
    baseTheme: AgChartThemeName;
    params: Record<string, unknown>;
    palette: Palette;
};

export const toChartTheme = ({ baseTheme, params, palette }: ChartsThemeSelection): ChartsTheme => {
    const themeParams = toChartThemeParams(params);
    return {
        baseTheme,
        ...(Object.keys(themeParams).length > 0 ? { params: themeParams } : {}),
        // Through `toThemePalette`, which drops the editor's own bookkeeping.
        // What is left is a structural subset of AgChartThemePalette - plain
        // colours where AG Charts also allows gradients.
        ...(paletteIsEmpty(palette) ? {} : { palette: toThemePalette(palette) satisfies AgChartThemePalette }),
    };
};

/**
 * Render the selection as the theme object a user would paste into their app.
 * AG Charts themes are plain options objects, so unlike grid and Studio there is
 * no builder chain to emit - which also means no import statement is needed.
 */
export const renderChartsThemeCode = (selection: ChartsThemeSelection): string => {
    const theme = toChartTheme(selection);
    const json = JSON.stringify(theme, null, 4)
        // quoted keys read as JSON rather than as the JS object users write
        .replaceAll(/^(\s+)"([A-Za-z_$][\w$]*)":/gm, '$1$2:')
        .replaceAll('"', "'");
    return ['// pass myTheme to the `theme` option of your chart', `export const myTheme = ${json};`, ''].join('\n');
};
