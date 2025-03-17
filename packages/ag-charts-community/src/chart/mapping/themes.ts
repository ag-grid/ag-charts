import {
    Logger,
    type OptionsDefs,
    arrayOf,
    color,
    gradient,
    gradientStrict,
    object,
    or,
    string,
    validate,
} from 'ag-charts-core';
import type {
    AgChartTheme,
    AgChartThemeName,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgChartThemeParams,
} from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { simpleMemorize } from '../../util/memo';
import { mergeDefaults } from '../../util/object';
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
type ThemeMap = { [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: () => ChartTheme };

const lightTheme = simpleMemorize(() => new ChartTheme());
const darkTheme = simpleMemorize(() => new DarkTheme());

const themeCacheDebug = Debug.create(true, 'perf');
const cacheCallback = (status: 'hit' | 'miss', fn: Function, keys: any[]) => {
    themeCacheDebug(`[CACHE] ChartTheme`, status, fn.name, keys);
};

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': darkTheme,
    'ag-sheets-dark': simpleMemorize(() => new SheetsDark(), cacheCallback),
    'ag-polychroma-dark': simpleMemorize(() => new PolychromaDark(), cacheCallback),
    'ag-vivid-dark': simpleMemorize(() => new VividDark(), cacheCallback),
    'ag-material-dark': simpleMemorize(() => new MaterialDark(), cacheCallback),
    'ag-financial-dark': simpleMemorize(() => new FinancialDark(), cacheCallback),

    // lightThemes,
    null: lightTheme,
    undefined: lightTheme,
    'ag-default': lightTheme,
    'ag-sheets': simpleMemorize(() => new SheetsLight(), cacheCallback),
    'ag-polychroma': simpleMemorize(() => new PolychromaLight(), cacheCallback),
    'ag-vivid': simpleMemorize(() => new VividLight(), cacheCallback),
    'ag-material': simpleMemorize(() => new MaterialLight(), cacheCallback),
    'ag-financial': simpleMemorize(() => new FinancialLight(), cacheCallback),
};

export const getChartTheme = simpleMemorize(createChartTheme, cacheCallback);

function createChartTheme(value: unknown): ChartTheme {
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

    const { errors } = validate(value, themeOptionsDef, 'theme');

    if (!errors.length) {
        const flattenedTheme = reduceThemeOptions(value);
        const baseTheme: any = flattenedTheme.baseTheme ? getChartTheme(flattenedTheme.baseTheme) : lightTheme();
        return new baseTheme.constructor(flattenedTheme);
    }

    for (const { message } of errors) {
        Logger.warnOnce(message);
    }

    return lightTheme();
}

function reduceThemeOptions(options: AgChartTheme): AgChartTheme {
    let maybeNested: AgChartTheme | AgChartThemeName | undefined = options;
    let palette: AgChartThemePalette | undefined;
    let params: AgChartThemeParams | undefined;
    const overrides: AgChartThemeOverrides[] = [];
    while (typeof maybeNested === 'object') {
        palette ??= maybeNested.palette; // Use first palette found, they can't be merged.
        params ??= maybeNested.params;
        if (maybeNested.overrides) {
            overrides.push(maybeNested.overrides);
        }
        maybeNested = maybeNested.baseTheme;
    }
    return {
        baseTheme: maybeNested,
        overrides: mergeDefaults(...overrides),
        params,
        palette,
    };
}

const themeOptionsDef: OptionsDefs<AgChartTheme> = {
    baseTheme: or(string, object),
    overrides: object,
    params: object,
    palette: {
        fills: arrayOf(or(color, gradient)),
        strokes: arrayOf(color),
        up: { fill: or(color, gradientStrict), stroke: color },
        down: { fill: or(color, gradientStrict), stroke: color },
        neutral: { fill: or(color, gradientStrict), stroke: color },
    },
};
