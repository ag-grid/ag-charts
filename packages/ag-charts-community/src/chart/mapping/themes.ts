import {
    Debug,
    type Logger,
    ModuleRegistry,
    type ModuleScope,
    type OptionsDefs,
    type RegistryRevision,
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
type ThemeFactory = (presetName?: string, moduleRegistry?: ModuleScope) => ChartTheme;
type ThemeMap = {
    [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: ThemeFactory;
};

/**
 * Each `ChartTheme` instance bakes in per-series-type / per-axis-type defaults derived from
 * `ModuleScope.listModulesByType` at construction time. The result must be invalidated whenever
 * the registry changes — e.g. when enterprise modules register after the first chart was created —
 * otherwise subsequent charts see a stale `theme.config` missing the new types and throw during
 * axis layout.
 *
 * `ModuleScope.ifRegistryChanged` returns the current registry revision and runs the supplied
 * callback only when it differs from the caller's last-seen value, giving each cache an explicit,
 * O(1) invalidation point.
 *
 * A preset's `themeTemplate` is baked in at construction too, so `presetName` is part of the key —
 * a theme built for one preset must never be handed to a chart using another (or none). Caches are held
 * per module scope, so a chart with instance modules never reads a theme built for a different module set.
 */
function memoizeByRegistry(factory: ThemeFactory): ThemeFactory {
    const scoped = new WeakMap<
        ModuleScope,
        { cached: Map<string | undefined, ChartTheme>; lastSeen: RegistryRevision }
    >();
    return (presetName, moduleRegistry = ModuleRegistry.resolveModuleScope()) => {
        let entry = scoped.get(moduleRegistry);
        if (entry == null) {
            entry = { cached: new Map(), lastSeen: -1 };
            scoped.set(moduleRegistry, entry);
        }
        const { cached } = entry;
        entry.lastSeen = moduleRegistry.ifRegistryChanged(entry.lastSeen, () => cached.clear());
        if (!cached.has(presetName)) {
            cached.set(presetName, factory(presetName, moduleRegistry));
        }
        return cached.get(presetName)!;
    };
}

const lightTheme = memoizeByRegistry((presetName, moduleRegistry) => new ChartTheme({}, presetName, moduleRegistry));

export const themes: ThemeMap = {
    // darkThemes,
    'ag-default-dark': memoizeByRegistry((presetName, moduleRegistry) => new DarkTheme({}, presetName, moduleRegistry)),
    'ag-sheets-dark': memoizeByRegistry((presetName, moduleRegistry) => new SheetsDark({}, presetName, moduleRegistry)),
    'ag-polychroma-dark': memoizeByRegistry(
        (presetName, moduleRegistry) => new PolychromaDark({}, presetName, moduleRegistry)
    ),
    'ag-vivid-dark': memoizeByRegistry((presetName, moduleRegistry) => new VividDark({}, presetName, moduleRegistry)),
    'ag-material-dark': memoizeByRegistry(
        (presetName, moduleRegistry) => new MaterialDark({}, presetName, moduleRegistry)
    ),
    'ag-financial-dark': memoizeByRegistry(
        (presetName, moduleRegistry) => new FinancialDark({}, presetName, moduleRegistry)
    ),

    // lightThemes,
    'ag-default': lightTheme,
    'ag-sheets': memoizeByRegistry((presetName, moduleRegistry) => new SheetsLight({}, presetName, moduleRegistry)),
    'ag-polychroma': memoizeByRegistry(
        (presetName, moduleRegistry) => new PolychromaLight({}, presetName, moduleRegistry)
    ),
    'ag-vivid': memoizeByRegistry((presetName, moduleRegistry) => new VividLight({}, presetName, moduleRegistry)),
    'ag-material': memoizeByRegistry((presetName, moduleRegistry) => new MaterialLight({}, presetName, moduleRegistry)),
    'ag-financial': memoizeByRegistry(
        (presetName, moduleRegistry) => new FinancialLight({}, presetName, moduleRegistry)
    ),
};

// Both caches key on preset name first: a preset's `themeTemplate` is baked into the instance, so the
// preset name must stay OUTSIDE the weak key or a per-chart options object pins its ChartTheme forever.
type ScopedChartThemeCache = {
    byValue: Map<string | undefined, Map<string | null | undefined, ChartTheme>>;
    byObject: Map<string | undefined, WeakMap<object, ChartTheme>>;
    revision: RegistryRevision;
};
let chartThemeCaches = new WeakMap<ModuleScope, ScopedChartThemeCache>();
const themeCacheDebug = Debug.create(true, 'perf', 'theme');

function chartThemeCacheFor(moduleRegistry: ModuleScope): ScopedChartThemeCache {
    let scoped = chartThemeCaches.get(moduleRegistry);
    if (scoped == null) {
        scoped = { byValue: new Map(), byObject: new Map(), revision: -1 };
        chartThemeCaches.set(moduleRegistry, scoped);
    }
    scoped.revision = moduleRegistry.ifRegistryChanged(scoped.revision, () => {
        scoped.byValue.clear();
        scoped.byObject.clear();
    });
    return scoped;
}

export const getChartTheme: typeof createChartTheme = (
    value,
    logger,
    presetName,
    moduleRegistry = ModuleRegistry.resolveModuleScope()
) => {
    const { byValue: chartThemeCache, byObject: chartThemeObjectCache } = chartThemeCacheFor(moduleRegistry);

    const objectKey = typeof value === 'object' && value !== null ? value : undefined;
    let theme: ChartTheme | undefined;
    if (objectKey) {
        theme = chartThemeObjectCache.get(presetName)?.get(objectKey);
    } else {
        theme = chartThemeCache.get(presetName)?.get(value as string | null | undefined);
    }

    if (theme == null) {
        themeCacheDebug('[CACHE] ChartTheme', 'miss', createChartTheme.name, [value, presetName]);
        theme = createChartTheme(value, logger, presetName, moduleRegistry);
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
    chartThemeCaches = new WeakMap();
}

function createChartTheme(
    value: unknown,
    logger: Logger = ambientLogger,
    presetName: string | undefined = undefined,
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): ChartTheme {
    if (value instanceof ChartTheme) {
        return value;
    }

    // A preset's `baseTheme` is the base its styling assumes, so it stands in wherever the user's own
    // theme does not name one — including when that theme is rejected as invalid.
    const presetBaseTheme = presetName == null ? undefined : moduleRegistry.getPresetModule(presetName)?.baseTheme;

    if (!validateStructure(value, logger)) {
        return presetBaseTheme
            ? getChartTheme(presetBaseTheme, logger, presetName, moduleRegistry)
            : lightTheme(presetName, moduleRegistry);
    }

    if (value == null || typeof value === 'string') {
        const stockTheme = themes[(value as AgChartThemeName) ?? 'ag-default'];
        if (stockTheme) {
            return stockTheme(presetName, moduleRegistry);
        }
        throw new Error(`Cannot find theme \`${value}\`.`);
    }

    const { cleared, invalid } = validate(reduceThemeOptions(value), themeOptionsDef, 'theme', { logger });

    for (const error of invalid) {
        logger.warnOnce(String(error));
    }

    const baseThemeValue = cleared?.baseTheme ?? presetBaseTheme;

    const baseTheme: any = baseThemeValue
        ? getChartTheme(baseThemeValue, logger, presetName, moduleRegistry)
        : lightTheme(presetName, moduleRegistry);
    return cleared ? new baseTheme.constructor(cleared, presetName, moduleRegistry) : baseTheme;
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
