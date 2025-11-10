import {
    Debug,
    Logger,
    type OptionsDefs,
    arrayOf,
    boolean,
    color,
    colorUnion,
    fontFamilyFull,
    gradientStrict,
    isObject,
    mergeDefaults,
    number,
    object,
    or,
    string,
    union,
    validate,
} from 'ag-charts-core';
import type {
    AgChartTheme,
    AgChartThemeName,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgChartThemeParams,
} from 'ag-charts-types';

import { simpleMemorize } from '../../util/memo';
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
import { themeOverridesOptionsWithOperatorsDef } from '../themes/themeOptionsDef';
import { VividDark } from '../themes/vividDark';
import { VividLight } from '../themes/vividLight';

type SpecialThemeName = 'ag-financial' | 'ag-financial-dark';
type ThemeMap = { [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: () => ChartTheme };

const lightTheme = simpleMemorize(() => new ChartTheme());

const themeCacheDebug = Debug.create(true, 'perf');
const cacheCallback = (status: 'hit' | 'miss', fn: Function, keys: any[]) => {
    themeCacheDebug(`[CACHE] ChartTheme`, status, fn.name, keys);
};

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': simpleMemorize(() => new DarkTheme()),
    'ag-sheets-dark': simpleMemorize(() => new SheetsDark(), cacheCallback),
    'ag-polychroma-dark': simpleMemorize(() => new PolychromaDark(), cacheCallback),
    'ag-vivid-dark': simpleMemorize(() => new VividDark(), cacheCallback),
    'ag-material-dark': simpleMemorize(() => new MaterialDark(), cacheCallback),
    'ag-financial-dark': simpleMemorize(() => new FinancialDark(), cacheCallback),

    // lightThemes,
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
    } else if (!validateStructure(value)) {
        return lightTheme();
    }

    if (value == null || typeof value === 'string') {
        const stockTheme = themes[(value as AgChartThemeName) ?? 'ag-default'];
        if (stockTheme) {
            return stockTheme();
        }
        throw new Error(`Cannot find theme \`${value}\`.`);
    }

    const { cleared, invalid } = validate(reduceThemeOptions(value), themeOptionsDef, 'theme');

    for (const error of invalid) {
        Logger.warnOnce(String(error));
    }

    const baseTheme: any = cleared?.baseTheme ? getChartTheme(cleared.baseTheme) : lightTheme();
    return cleared ? new baseTheme.constructor(cleared) : baseTheme;
}

function reduceThemeOptions(options: AgChartTheme): AgChartTheme {
    if (!isObject(options) || !isObject(options.baseTheme)) return options;
    let maybeNested: AgChartTheme | AgChartThemeName | undefined = options;
    let palette: AgChartThemePalette | undefined;
    let params: AgChartThemeParams | undefined;
    const overrides: AgChartThemeOverrides[] = [];
    while (typeof maybeNested === 'object') {
        palette ??= maybeNested.palette; // Use the first palette found; they can't be merged.
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

export const themeOptionsDef: OptionsDefs<AgChartTheme> = {
    baseTheme: or(string, object),
    overrides: themeOverridesOptionsWithOperatorsDef,
    params: {
        accentColor: color,
        axisColor: color,
        backgroundColor: color,
        borderColor: color,
        borderRadius: number,
        chartBackgroundColor: color,
        chartPadding: number,
        focusShadow: string,
        foregroundColor: color,
        fontFamily: fontFamilyFull,
        fontSize: number,
        fontWeight: or(string, number),
        gridLineColor: color,
        popupShadow: string,
        subtleTextColor: color,
        textColor: color,

        chromeBackgroundColor: color,
        chromeFontFamily: fontFamilyFull,
        chromeFontSize: number,
        chromeFontWeight: or(string, number),
        chromeSubtleTextColor: color,
        chromeTextColor: color,

        buttonBackgroundColor: color,
        buttonBorder: boolean,
        buttonFontWeight: number,
        buttonTextColor: color,

        inputBackgroundColor: color,
        inputBorder: boolean,
        inputTextColor: color,

        menuBackgroundColor: color,
        menuBorder: boolean,
        menuTextColor: color,

        panelBackgroundColor: color,
        panelSubtleTextColor: color,

        tooltipBackgroundColor: color,
        tooltipBorder: boolean,
        tooltipTextColor: color,
        tooltipSubtleTextColor: color,

        crosshairLabelBackgroundColor: color,
        crosshairLabelTextColor: color,
    },
    palette: {
        fills: arrayOf(colorUnion),
        strokes: arrayOf(color),
        up: { fill: or(color, gradientStrict), stroke: color },
        down: { fill: or(color, gradientStrict), stroke: color },
        neutral: { fill: or(color, gradientStrict), stroke: color },
    },
};

const themeNameValidator = union(
    'ag-default',
    'ag-default-dark',
    'ag-sheets',
    'ag-sheets-dark',
    'ag-polychroma',
    'ag-polychroma-dark',
    'ag-vivid',
    'ag-vivid-dark',
    'ag-material',
    'ag-material-dark',
    'ag-financial',
    'ag-financial-dark'
);

function validateStructure(value: unknown) {
    const { invalid } = validate<{ theme?: AgChartTheme | AgChartThemeName }>(
        { theme: value },
        { theme: or(themeNameValidator, object) }
    );
    for (const error of invalid) {
        Logger.warnOnce(String(error));
    }
    return invalid.length === 0;
}
