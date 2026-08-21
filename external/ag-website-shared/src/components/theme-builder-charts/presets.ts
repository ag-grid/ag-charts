import type { Preset } from '@ag-website-shared/theming/preset';
import type { AgChartThemeName } from 'ag-charts-community';

import { CHARTS_PARAM_DEFAULTS, getPalette, getStackParams } from './chartsTheme';
import type { Palette } from './paletteModel';

/**
 * The AG Charts stock themes, offered as presets.
 *
 * They are a natural fit for the shared preset model because of what actually
 * separates them: the light themes differ from `ag-default` by palette alone -
 * not one public param between them - and the dark themes add a handful of
 * colour params on top. So a preset is "a palette, plus whatever params the dark
 * variant changes", which is exactly the shape the shared `Preset` carries once
 * the palette is split out into the host's own atom.
 *
 * Everything here is derived from the AG Charts runtime, so a new stock theme or
 * a retuned palette needs no change in the builder.
 */

export type ChartsPreset = {
    id: string;
    label: string;
    light: AgChartThemeName;
    dark: AgChartThemeName;
};

/**
 * Ordered so no two neighbours look alike.
 *
 * Default, Material and Vivid run the same hue sequence and differ mainly in
 * saturation, so listing them together made the first half of the row read as
 * one theme three times. Polychroma, Sheets and Financial are the distinctive
 * ones, so they are interleaved between them. Default stays first because it is
 * the theme a chart gets when you ask for nothing.
 */
export const PRESETS: ChartsPreset[] = [
    { id: 'default', label: 'Default', light: 'ag-default', dark: 'ag-default-dark' },
    { id: 'polychroma', label: 'Polychroma', light: 'ag-polychroma', dark: 'ag-polychroma-dark' },
    { id: 'material', label: 'Material', light: 'ag-material', dark: 'ag-material-dark' },
    { id: 'financial', label: 'Financial', light: 'ag-financial', dark: 'ag-financial-dark' },
    { id: 'vivid', label: 'Vivid', light: 'ag-vivid', dark: 'ag-vivid-dark' },
    { id: 'sheets', label: 'Sheets', light: 'ag-sheets', dark: 'ag-sheets-dark' },
];

export const DEFAULT_PRESET = PRESETS[0];

export const themeNameFor = (preset: ChartsPreset, isDark: boolean) => (isDark ? preset.dark : preset.light);

/**
 * Params a preset must not carry, however the stock theme defines them.
 *
 * A preset is a proposition about appearance - colours, borders, tooltips - and
 * the user should be able to try one without the chart changing shape underneath
 * them. `ag-financial` sets `chartPadding: 0`, which suits a financial chart
 * inside its own framed toolbar layout but makes that one preset visibly resize
 * the preview. Layout stays whatever the user chose; it is still editable in the
 * panel, just never written by picking a preset.
 */
const LAYOUT_PARAMS = new Set(['chartPadding']);

/**
 * Only the params a preset actually changes. Passing the full set would mark all
 * 46 as user overrides, and the exported snippet would restate the entire theme
 * rather than the handful of values that make it distinctive.
 */
const paramsDifferingFromDefault = (themeName: AgChartThemeName): Record<string, unknown> => {
    const params = getStackParams(themeName);
    return Object.fromEntries(
        Object.entries(params).filter(
            ([property, value]) =>
                !LAYOUT_PARAMS.has(property) &&
                JSON.stringify(value) !== JSON.stringify(CHARTS_PARAM_DEFAULTS[property])
        )
    );
};

export const toSharedPreset = (preset: ChartsPreset, isDark: boolean): Preset => {
    const themeName = themeNameFor(preset, isDark);
    const params = paramsDifferingFromDefault(themeName);
    const backgroundColor = getStackParams(themeName).backgroundColor;
    return {
        pageBackgroundColor: typeof backgroundColor === 'string' ? backgroundColor : '#ffffff',
        params,
    };
};

export const paletteFor = (preset: ChartsPreset, isDark: boolean): Palette => getPalette(themeNameFor(preset, isDark));
