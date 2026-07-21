import {
    Debug,
    Logger,
    ModuleRegistry,
    type OptionsDefs,
    arrayOf,
    boolean,
    color,
    colorOrRef,
    fontFamilyFull,
    fontWeight,
    gradientStrict,
    isObject,
    mergeDefaults,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    simpleColorUnion,
    string,
    union,
    validate,
} from 'ag-charts-core';
import type {
    AgBorderThemeParam,
    AgChartTheme,
    AgChartThemeName,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgChartThemeParams,
} from 'ag-charts-types';

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

/**
 * Each `ChartTheme` instance bakes in per-series-type / per-axis-type defaults derived from
 * `ModuleRegistry.listModulesByType` at construction time. The result must be invalidated whenever
 * the registry changes — e.g. when enterprise modules register after the first chart was created —
 * otherwise subsequent charts see a stale `theme.config` missing the new types and throw during
 * axis layout.
 *
 * `ModuleRegistry.ifRegistryChanged` returns the current registry revision and runs the supplied
 * callback only when it differs from the caller's last-seen value, giving each cache an explicit,
 * O(1) invalidation point.
 */
function memoizeByRegistry<T>(factory: () => T): () => T {
    let cached: T | undefined;
    let lastSeen = -1;
    return () => {
        lastSeen = ModuleRegistry.ifRegistryChanged(lastSeen, () => {
            cached = factory();
        });
        return cached!;
    };
}

const lightTheme = memoizeByRegistry(() => new ChartTheme());

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': memoizeByRegistry(() => new DarkTheme()),
    'ag-sheets-dark': memoizeByRegistry(() => new SheetsDark()),
    'ag-polychroma-dark': memoizeByRegistry(() => new PolychromaDark()),
    'ag-vivid-dark': memoizeByRegistry(() => new VividDark()),
    'ag-material-dark': memoizeByRegistry(() => new MaterialDark()),
    'ag-financial-dark': memoizeByRegistry(() => new FinancialDark()),

    // lightThemes,
    'ag-default': lightTheme,
    'ag-sheets': memoizeByRegistry(() => new SheetsLight()),
    'ag-polychroma': memoizeByRegistry(() => new PolychromaLight()),
    'ag-vivid': memoizeByRegistry(() => new VividLight()),
    'ag-material': memoizeByRegistry(() => new MaterialLight()),
    'ag-financial': memoizeByRegistry(() => new FinancialLight()),
};

// Primitive keys (stock theme names) are bounded and held strongly. Object keys (inline theme
// option objects) are held weakly: a fresh options object per chart would otherwise pin its
// resolved ChartTheme — and the deep config tree it owns — for the lifetime of the process,
// leaking memory for consumers that render many charts with distinct inline themes.
const chartThemeCache = new Map<string | null | undefined, ChartTheme>();
let chartThemeObjectCache = new WeakMap<object, ChartTheme>();
let chartThemeCacheRevision = -1;
const themeCacheDebug = Debug.create(true, 'perf', 'theme');

export const getChartTheme: typeof createChartTheme = (value) => {
    chartThemeCacheRevision = ModuleRegistry.ifRegistryChanged(chartThemeCacheRevision, () => {
        chartThemeCache.clear();
        chartThemeObjectCache = new WeakMap();
    });
    const objectKey = typeof value === 'object' && value !== null ? value : undefined;
    let theme = objectKey
        ? chartThemeObjectCache.get(objectKey)
        : chartThemeCache.get(value as string | null | undefined);
    if (theme == null) {
        themeCacheDebug('[CACHE] ChartTheme', 'miss', createChartTheme.name, [value]);
        theme = createChartTheme(value);
        if (objectKey) {
            chartThemeObjectCache.set(objectKey, theme);
        } else {
            chartThemeCache.set(value as string | null | undefined, theme);
        }
    } else {
        themeCacheDebug('[CACHE] ChartTheme', 'hit', createChartTheme.name, [value]);
    }
    return theme;
};

/** Test-only: drop all cached entries so cases start from a known cold state. */
export function __clearChartThemeCacheForTests() {
    chartThemeCache.clear();
    chartThemeObjectCache = new WeakMap();
    chartThemeCacheRevision = -1;
}

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
        Logger.default.warnOnce(String(error));
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

const themeParamBorder = optionsDefs<AgBorderThemeParam>({
    color: colorOrRef,
    width: positiveNumber,
});

export const themeOptionsDef: OptionsDefs<AgChartTheme> = {
    baseTheme: or(string, object),
    overrides: themeOverridesOptionsWithOperatorsDef,
    params: {
        accentColor: colorOrRef,
        axisLineColor: colorOrRef,
        backgroundColor: colorOrRef,
        borderColor: colorOrRef,
        borderRadius: number,
        borderWidth: number,
        chartBackgroundColor: colorOrRef,
        chartPadding: number,
        focusShadow: string,
        foregroundColor: colorOrRef,
        fontFamily: fontFamilyFull,
        fontSize: number,
        fontWeight: fontWeight,
        gridLineColor: colorOrRef,
        popupShadow: string,
        subtleTextColor: colorOrRef,
        textColor: colorOrRef,
        groupedCategoryLineColor: colorOrRef,

        chromeBackgroundColor: colorOrRef,
        chromeFontFamily: fontFamilyFull,
        chromeFontSize: number,
        chromeFontWeight: fontWeight,
        chromeSubtleTextColor: colorOrRef,
        chromeTextColor: colorOrRef,

        buttonBackgroundColor: colorOrRef,
        buttonBorder: or(boolean, themeParamBorder),
        buttonBorderRadius: number,
        buttonFontWeight: fontWeight,
        buttonTextColor: colorOrRef,

        inputBackgroundColor: colorOrRef,
        inputBorder: or(boolean, themeParamBorder),
        inputBorderRadius: number,
        inputTextColor: colorOrRef,

        menuBackgroundColor: colorOrRef,
        menuBorder: or(boolean, themeParamBorder),
        menuBorderRadius: number,
        menuTextColor: colorOrRef,

        panelBackgroundColor: colorOrRef,
        panelSubtleTextColor: colorOrRef,

        tooltipBackgroundColor: colorOrRef,
        tooltipBorder: or(boolean, themeParamBorder),
        tooltipBorderRadius: number,
        tooltipTextColor: colorOrRef,
        tooltipSubtleTextColor: colorOrRef,

        crosshairLabelBackgroundColor: colorOrRef,
        crosshairLabelTextColor: colorOrRef,
    },
    palette: {
        fills: arrayOf(simpleColorUnion),
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
        Logger.default.warnOnce(String(error));
    }
    return invalid.length === 0;
}
