import type { AgChartTheme, AgChartThemeName, AgChartThemeOverrides } from '../../options/agChartOptions';
import { jsonMerge } from '../../util/json';
import { ChartTheme } from '../themes/chartTheme';
import { DarkTheme } from '../themes/darkTheme';
import { MaterialDark } from '../themes/materialDark';
import { MaterialLight } from '../themes/materialLight';
import { PolychromaDark } from '../themes/polychromaDark';
import { PolychromaLight } from '../themes/polychromaLight';
import { SheetsDark } from '../themes/sheetsDark';
import { SheetsLight } from '../themes/sheetsLight';
import { VividDark } from '../themes/vividDark';
import { VividLight } from '../themes/vividLight';

export type ThemeMap = { [key in AgChartThemeName | 'undefined' | 'null']?: () => ChartTheme };

const lightTheme = () => new ChartTheme();
const darkTheme = () => new DarkTheme();

const lightThemes: ThemeMap = {
    undefined: lightTheme,
    null: lightTheme,
    'ag-default': lightTheme,
    'ag-sheets': () => new SheetsLight(),
    'ag-polychroma': () => new PolychromaLight(),
    'ag-vivid': () => new VividLight(),
    'ag-material': () => new MaterialLight(),
};

const darkThemes: ThemeMap = {
    undefined: darkTheme,
    null: darkTheme,
    'ag-default-dark': darkTheme,
    'ag-sheets-dark': () => new SheetsDark(),
    'ag-polychroma-dark': () => new PolychromaDark(),
    'ag-vivid-dark': () => new VividDark(),
    'ag-material-dark': () => new MaterialDark(),
};

export const themes: ThemeMap = {
    ...darkThemes,
    ...lightThemes,
};

export function getChartTheme(value?: string | ChartTheme | AgChartTheme): ChartTheme {
    if (value instanceof ChartTheme) {
        return value;
    }

    const stockTheme = themes[value as AgChartThemeName];
    if (stockTheme) {
        return stockTheme();
    }

    value = value as AgChartTheme;

    // Flatten recursive themes.
    const overrides: AgChartThemeOverrides[] = [];
    let palette;
    while (typeof value === 'object') {
        overrides.push(value.overrides ?? {});

        // Use first palette found, they can't be merged.
        if (value.palette && palette == null) {
            palette = value.palette;
        }

        value = value.baseTheme;
    }
    overrides.reverse();

    const flattenedTheme = {
        baseTheme: value,
        overrides: jsonMerge(overrides),
        ...(palette ? { palette } : {}),
    };

    if (flattenedTheme.baseTheme || flattenedTheme.overrides) {
        const baseTheme: any = getChartTheme(flattenedTheme.baseTheme);
        return new baseTheme.constructor(flattenedTheme);
    }

    return lightTheme();
}
