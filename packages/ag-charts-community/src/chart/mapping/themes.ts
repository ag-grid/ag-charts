import type { AgChartTheme, AgChartThemeName, AgChartThemeOverrides, AgChartThemePalette } from 'ag-charts-types';

import { Logger } from '../../util/logger';
import { mergeDefaults } from '../../util/object';
import { type OptionsDefs, arrayOf, isValid, object, or, string } from '../../util/validate';
import { ChartTheme } from '../themes/chartTheme';
import { DarkTheme } from '../themes/darkTheme';
import { FinancialDark } from '../themes/financialDark';
import { FinancialLight } from '../themes/financialLight';
import { MaterialDark } from '../themes/materialDark';
import { MaterialLight } from '../themes/materialLight';
import { PolychromaDark } from '../themes/polychromaDark';
import { PolychromaLight } from '../themes/polychromaLight';
import { SheetsDark } from '../themes/sheetsDark';
import { SheetsLight } from '../themes/sheetsLight';
import { VividDark } from '../themes/vividDark';
import { VividLight } from '../themes/vividLight';

type SpecialThemeName = 'ag-financial' | 'ag-financial-dark';
export type ThemeMap = { [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: () => ChartTheme };

const lightTheme = () => new ChartTheme();
const darkTheme = () => new DarkTheme();

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': darkTheme,
    'ag-sheets-dark': () => new SheetsDark(),
    'ag-polychroma-dark': () => new PolychromaDark(),
    'ag-vivid-dark': () => new VividDark(),
    'ag-material-dark': () => new MaterialDark(),
    'ag-financial-dark': () => new FinancialDark(),

    // lightThemes,
    null: lightTheme,
    undefined: lightTheme,
    'ag-default': lightTheme,
    'ag-sheets': () => new SheetsLight(),
    'ag-polychroma': () => new PolychromaLight(),
    'ag-vivid': () => new VividLight(),
    'ag-material': () => new MaterialLight(),
    'ag-financial': () => new FinancialLight(),
};

export function getChartTheme(value: unknown): ChartTheme {
    if (value instanceof ChartTheme) {
        return value;
    }

    if (value == null || typeof value === 'string') {
        const stockTheme = themes[value as AgChartThemeName];
        if (stockTheme) {
            return stockTheme();
        }
        Logger.warnOnce(`the theme [${value}] is invalid, using [ag-default] instead.`);
        return lightTheme();
    }

    if (isValid(value, themeOptionsDef, 'theme')) {
        const flattenedTheme = reduceThemeOptions(value);
        const baseTheme: any = flattenedTheme.baseTheme ? getChartTheme(flattenedTheme.baseTheme) : lightTheme();
        return new baseTheme.constructor(flattenedTheme);
    }

    return lightTheme();
}

function reduceThemeOptions(options: AgChartTheme): AgChartTheme {
    let maybeNested: AgChartTheme | AgChartThemeName | undefined = options;
    let palette: AgChartThemePalette | undefined;
    const overrides: AgChartThemeOverrides[] = [];
    while (typeof maybeNested === 'object') {
        palette ??= maybeNested.palette; // Use first palette found, they can't be merged.
        if (maybeNested.overrides) {
            overrides.push(maybeNested.overrides);
        }
        maybeNested = maybeNested.baseTheme;
    }
    return {
        baseTheme: maybeNested,
        overrides: mergeDefaults(...overrides),
        palette,
    };
}

const themeOptionsDef: OptionsDefs<AgChartTheme> = {
    baseTheme: or(string, object),
    overrides: object,
    palette: {
        fills: arrayOf(string),
        strokes: arrayOf(string),
        up: { fill: string, stroke: string },
        down: { fill: string, stroke: string },
        neutral: { fill: string, stroke: string },
    },
};
