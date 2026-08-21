import {
    EMPTY_PALETTE,
    type Palette,
    type PaletteAccent,
    type SeriesColor,
    fromSeriesColors,
} from '@ag-website-shared/components/theme-builder/palette';
import { _Theme } from 'ag-charts-community';
import type { AgChartThemeName, AgPaletteColors } from 'ag-charts-community';
import { createPart, createSharedTheme } from 'ag-stack';

import { themeLogger } from './themeLogger';

/**
 * AG Charts resolves theme params itself, onto a canvas, and does not expose an
 * ag-stack `Theme`. The shared theme-builder model is built around one: it reads
 * the param catalogue and each param's inherited default from a Theme, and
 * renders that Theme's params CSS so the editors can resolve `var(--ag-*)`
 * references to concrete colours.
 *
 * So the builder drives a *shadow* theme - an ag-stack theme carrying nothing
 * but AG Charts' own param names and defaults. It never styles anything the user
 * sees; the preview chart is themed by handing AG Charts a real `AgChartTheme`
 * built from the same values (see `chartsThemeOutput.ts`). The shadow theme
 * exists only to give the shared model something of the shape it expects.
 *
 * What this buys us is that every editor, colour picker and reference-resolution
 * path in `components/theme-builder` works untouched. The cost is that the two
 * representations must be kept in step - which is what `chartsTheme.test.ts`
 * asserts, and why every value here is derived from the AG Charts runtime rather
 * than copied out of it.
 */

/** A value in an AG Charts param default: a literal, or a `$`-prefixed operation. */
type ChartsParamValue = unknown;

const isOperation = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value != null && !Array.isArray(value);

/** Pull the param name out of a `{ $ref }`, or undefined for anything else. */
const refName = (value: unknown): string | undefined =>
    isOperation(value) && typeof value.$ref === 'string' ? value.$ref : undefined;

/**
 * AG Charts writes its own CSS variables as `--ag-charts-*`; the shadow theme
 * declares the ag-stack default `--ag-*`. Params whose default is a raw CSS
 * string can reference the former (e.g. `focusShadow`), so retarget them or they
 * resolve to nothing in the editors.
 */
const retargetCssVariables = (value: string) => value.replaceAll('var(--ag-charts-', 'var(--ag-');

/**
 * Convert one AG Charts param default into the equivalent ag-stack param value.
 *
 * Only the three operations AG Charts uses in its param defaults are translated
 * - `$ref`, `$mix` and `$foregroundBackgroundMix`. Anything else is dropped with
 * a warning rather than mistranslated, so a newly introduced operation surfaces
 * as a missing default instead of a wrong colour.
 */
export const toStackParamValue = (property: string, value: ChartsParamValue): unknown => {
    if (typeof value === 'string') {
        return retargetCssVariables(value);
    }
    if (!isOperation(value)) {
        // numbers (px lengths and font weights), booleans, and font-family arrays
        return value;
    }

    if ('$ref' in value) {
        return { ref: value.$ref };
    }

    if ('$foregroundBackgroundMix' in value) {
        // Color.mix(foreground, background, 1 - ratio) - i.e. `ratio` is the
        // weight of the foreground colour, which is exactly ag-stack's `mix`.
        return { ref: 'foregroundColor', mix: value.$foregroundBackgroundMix, onto: 'backgroundColor' };
    }

    if ('$mix' in value) {
        const [a, b, t] = value.$mix as [unknown, unknown, number];
        const ref = refName(a);
        const onto = refName(b);
        if (ref != null && onto != null) {
            // Color.mix(a, b, t) lerps a -> b, so `a` carries a weight of 1 - t.
            return { ref, mix: 1 - t, onto };
        }
        console.warn(`[charts theme builder] cannot express $mix for "${property}" as a param reference`);
        return undefined;
    }

    // Composite params such as `buttonBorder: { color, width }`, whose members
    // are themselves operations.
    return Object.fromEntries(
        Object.entries(value).map(([key, member]) => [key, toStackParamValue(`${property}.${key}`, member)])
    );
};

/**
 * The params the builder knows about: AG Charts' public catalogue. Read from the
 * static defaults rather than from a theme instance, because instances also
 * carry private params (e.g. `focusColor`) that are not part of the API.
 */
export const PUBLIC_PARAM_NAMES = Object.keys(_Theme.ChartTheme.getDefaultPublicParameters());

const getThemeInstance = (themeName: AgChartThemeName) => {
    const theme = _Theme.themes[themeName]?.();
    if (!theme) {
        throw new Error(`Unknown AG Charts theme "${themeName}"`);
    }
    return theme;
};

/** A stock theme's public params, in ag-stack's value format. */
export const getStackParams = (themeName: AgChartThemeName): Record<string, unknown> => {
    // `params` is the theme's own parameters merged over the defaults, and
    // includes private ones - so read it through the public catalogue.
    const params = getThemeInstance(themeName).params as Record<string, unknown>;
    return Object.fromEntries(
        PUBLIC_PARAM_NAMES.map((property) => [property, toStackParamValue(property, params[property])])
    );
};

/** An accent colour pair, narrowed to the plain colours the editor can show. */
const toAccent = ({ fill, stroke }: AgPaletteColors): PaletteAccent => ({
    fill: typeof fill === 'string' ? fill : undefined,
    stroke,
});

/**
 * A stock theme's palette, in the shared editor's shape.
 *
 * The instance already exposes fills and strokes as index-paired arrays rather
 * than the keyed objects used internally, so this is mostly a narrowing:
 * `AgChartThemePalette.fills` also admits gradients and patterns, which no stock
 * theme uses and no colour picker could edit. Such a slot is dropped along with
 * its paired stroke rather than stringified into nonsense.
 */
export const getPalette = (themeName: AgChartThemeName): Palette => {
    const { fills, strokes, up, down, neutral } = getThemeInstance(themeName).palette;
    const series: SeriesColor[] = [];
    fills.forEach((fill, index) => {
        if (typeof fill !== 'string') {
            console.warn(`[charts theme builder] Theme "${themeName}" palette fill ${index} is not a plain colour`);
            return;
        }
        series.push({ fill, stroke: strokes[index] ?? fill });
    });
    return fromSeriesColors(
        { ...EMPTY_PALETTE, up: toAccent(up), down: toAccent(down), neutral: toAccent(neutral) },
        series
    );
};

export const DEFAULT_THEME_NAME: AgChartThemeName = 'ag-default';

export const CHARTS_PARAM_DEFAULTS = getStackParams(DEFAULT_THEME_NAME);

/**
 * The shadow theme the shared model reads from. `createSharedTheme` starts empty
 * - it carries no grid params of its own - so the catalogue is exactly AG
 * Charts' params and nothing else.
 */
export const chartsShadowTheme = createSharedTheme(themeLogger).withPart(
    // The param map is keyed by AG Charts' names, which ag-stack cannot type
    // against its own catalogue - the values are validated at runtime instead,
    // through `themeLogger`.
    createPart({ feature: 'agCharts', params: CHARTS_PARAM_DEFAULTS as never })
);
