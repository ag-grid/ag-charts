import {
    Debug,
    type Logger,
    ModuleRegistry,
    type OptionsDefs,
    ambientLogger,
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
type ThemeMap = {
    [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: (presetName?: string) => ChartTheme;
};

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
 *
 * A preset's `themeTemplate` is baked in at construction too, so `presetName` is part of the key —
 * a theme built for one preset must never be handed to a chart using another (or none).
 */
function memoizeByRegistry<T>(factory: (presetName?: string) => T): (presetName?: string) => T {
    const cached = new Map<string | undefined, T>();
    let lastSeen = -1;
    return (presetName?: string) => {
        lastSeen = ModuleRegistry.ifRegistryChanged(lastSeen, () => cached.clear());
        if (!cached.has(presetName)) {
            cached.set(presetName, factory(presetName));
        }
        return cached.get(presetName)!;
    };
}

const lightTheme = memoizeByRegistry((presetName?: string) => {
    return new ChartTheme({}, presetName);
});

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': memoizeByRegistry((presetName?: string) => new DarkTheme({}, presetName)),
    'ag-sheets-dark': memoizeByRegistry((presetName?: string) => new SheetsDark({}, presetName)),
    'ag-polychroma-dark': memoizeByRegistry((presetName?: string) => new PolychromaDark({}, presetName)),
    'ag-vivid-dark': memoizeByRegistry((presetName?: string) => new VividDark({}, presetName)),
    'ag-material-dark': memoizeByRegistry((presetName?: string) => new MaterialDark({}, presetName)),
    'ag-financial-dark': memoizeByRegistry((presetName?: string) => new FinancialDark({}, presetName)),

    // lightThemes,
    'ag-default': lightTheme,
    'ag-sheets': memoizeByRegistry((presetName?: string) => new SheetsLight({}, presetName)),
    'ag-polychroma': memoizeByRegistry((presetName?: string) => new PolychromaLight({}, presetName)),
    'ag-vivid': memoizeByRegistry((presetName?: string) => new VividLight({}, presetName)),
    'ag-material': memoizeByRegistry((presetName?: string) => new MaterialLight({}, presetName)),
    'ag-financial': memoizeByRegistry((presetName?: string) => new FinancialLight({}, presetName)),
};

// Both caches key on preset name first: a preset's `themeTemplate` is baked into the instance, so the
// preset name must stay OUTSIDE the weak key or a per-chart options object pins its ChartTheme forever.
const chartThemeCache = new Map<string | undefined, Map<string | null | undefined, ChartTheme>>();
const chartThemeObjectCache = new Map<string | undefined, WeakMap<object, ChartTheme>>();
let chartThemeCacheRevision = -1;
const themeCacheDebug = Debug.create(true, 'perf', 'theme');

export const getChartTheme: typeof createChartTheme = (value, logger, presetName) => {
    chartThemeCacheRevision = ModuleRegistry.ifRegistryChanged(chartThemeCacheRevision, () => {
        chartThemeCache.clear();
        chartThemeObjectCache.clear();
    });

    const objectKey = typeof value === 'object' && value !== null ? value : undefined;
    let theme: ChartTheme | undefined;
    if (objectKey) {
        theme = chartThemeObjectCache.get(presetName)?.get(objectKey);
    } else {
        theme = chartThemeCache.get(presetName)?.get(value as string | null | undefined);
    }

    if (theme == null) {
        themeCacheDebug('[CACHE] ChartTheme', 'miss', createChartTheme.name, [value, presetName]);
        theme = createChartTheme(value, logger, presetName);
        if (objectKey) {
            let byObject = chartThemeObjectCache.get(presetName);
            if (byObject == null) {
                byObject = new WeakMap();
                chartThemeObjectCache.set(presetName, byObject);
            }
            byObject.set(objectKey, theme);
        } else {
            let byValue = chartThemeCache.get(presetName);
            if (byValue == null) {
                byValue = new Map();
                chartThemeCache.set(presetName, byValue);
            }
            byValue.set(value as string | null | undefined, theme);
        }
    } else {
        themeCacheDebug('[CACHE] ChartTheme', 'hit', createChartTheme.name, [value, presetName]);
    }
    return theme;
};

/** Test-only: drop all cached entries so cases start from a known cold state. */
export function __clearChartThemeCacheForTests() {
    chartThemeCache.clear();
    chartThemeObjectCache.clear();
    chartThemeCacheRevision = -1;
}

function createChartTheme(value: unknown, logger: Logger = ambientLogger, presetName?: string): ChartTheme {
    if (value instanceof ChartTheme) {
        return value;
    }

    // A preset's `baseTheme` is the base its styling assumes, so it stands in wherever the user's own
    // theme does not name one — including when that theme is rejected as invalid.
    const presetBaseTheme = presetName == null ? undefined : ModuleRegistry.getPresetModule(presetName)?.baseTheme;

    if (!validateStructure(value, logger)) {
        return presetBaseTheme ? getChartTheme(presetBaseTheme, logger, presetName) : lightTheme(presetName);
    }

    if (value == null || typeof value === 'string') {
        const stockTheme = themes[(value as AgChartThemeName) ?? 'ag-default'];
        if (stockTheme) {
            return stockTheme(presetName);
        }
        throw new Error(`Cannot find theme \`${value}\`.`);
    }

    const { cleared, invalid } = validate(reduceThemeOptions(value), themeOptionsDef, 'theme', { logger });

    for (const error of invalid) {
        logger.warnOnce(String(error));
    }

    const baseThemeValue = cleared?.baseTheme ?? presetBaseTheme;

    const baseTheme: any = baseThemeValue ? getChartTheme(baseThemeValue, logger, presetName) : lightTheme(presetName);
    return cleared ? new baseTheme.constructor(cleared, presetName) : baseTheme;
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
        chartPadding: positiveNumber,
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

function validateStructure(value: unknown, logger: Logger) {
    const { invalid } = validate<{ theme?: AgChartTheme | AgChartThemeName }>(
        { theme: value },
        { theme: or(themeNameValidator, object) },
        '',
        { logger }
    );
    for (const error of invalid) {
        logger.warnOnce(String(error));
    }
    return invalid.length === 0;
}
