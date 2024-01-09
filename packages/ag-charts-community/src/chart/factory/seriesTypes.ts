import type { SeriesConstructor, SeriesModule, SeriesPaletteFactory } from '../../module/coreModules';
import { hasRegisteredEnterpriseModules } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { AgChartOptions } from '../../options/agChartOptions';
import { deepClone } from '../../sparklines-util';
import { mergeDefaults } from '../../util/object';
import { isFunction } from '../../util/type-guards';
import type { SeriesOptions } from '../mapping/prepareSeries';
import type { SeriesOptionsTypes } from '../mapping/types';
import type { Series } from '../series/series';
import { registerChartSeriesType } from './chartTypes';

const SERIES_FACTORIES: Record<string, SeriesConstructor> = {};
const SERIES_DEFAULTS: Record<string, any> = {};
const SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const ENTERPRISE_SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const SERIES_PALETTE_FACTORIES: Record<string, SeriesPaletteFactory> = {};
const SOLO_SERIES_TYPES = new Set<SeriesOptionsTypes['type']>();
const STACKABLE_SERIES_TYPES = new Set<SeriesOptionsTypes['type']>();
const GROUPABLE_SERIES_TYPES = new Set<SeriesOptionsTypes['type']>();
const STACKED_BY_DEFAULT_SERIES_TYPES = new Set<string>();
const SWAP_DEFAULT_AXES_CONDITIONS: Record<string, (opts: any) => boolean> = {};

export function registerSeries({
    identifier: seriesType,
    chartTypes: [chartType],
    instanceConstructor,
    seriesDefaults,
    themeTemplate,
    enterpriseThemeTemplate,
    paletteFactory,
    solo,
    stackable,
    groupable,
    stackedByDefault,
    swapDefaultAxesCondition,
}: SeriesModule<any>) {
    SERIES_FACTORIES[seriesType] = instanceConstructor;
    SERIES_DEFAULTS[seriesType] = seriesDefaults;

    registerSeriesThemeTemplate(seriesType, themeTemplate, enterpriseThemeTemplate);

    if (paletteFactory) {
        addSeriesPaletteFactory(seriesType, paletteFactory);
    }
    if (solo) {
        addSoloSeriesType(seriesType);
    }
    if (stackable) {
        addStackableSeriesType(seriesType);
    }
    if (groupable) {
        addGroupableSeriesType(seriesType);
    }
    if (stackedByDefault) {
        addStackedByDefaultSeriesType(seriesType);
    }
    if (swapDefaultAxesCondition) {
        addSwapDefaultAxesCondition(seriesType, swapDefaultAxesCondition);
    }

    registerChartSeriesType(seriesType, chartType);
}

export function registerSeriesThemeTemplate(
    seriesType: NonNullable<SeriesOptionsTypes['type']>,
    themeTemplate: {},
    enterpriseThemeTemplate = {}
) {
    const existingTemplate = SERIES_THEME_TEMPLATES[seriesType];
    SERIES_THEME_TEMPLATES[seriesType] = mergeDefaults(themeTemplate, existingTemplate);
    ENTERPRISE_SERIES_THEME_TEMPLATES[seriesType] = mergeDefaults(
        enterpriseThemeTemplate,
        themeTemplate,
        existingTemplate
    );
}

export function getSeries(chartType: string, moduleCtx: ModuleContext): Series<any> {
    const seriesConstructor = SERIES_FACTORIES[chartType];
    if (seriesConstructor) {
        return new seriesConstructor(moduleCtx);
    }

    throw new Error(`AG Charts - unknown series type: ${chartType}`);
}

export function getSeriesDefaults<T extends AgChartOptions>(chartType: string, options: SeriesOptions): T {
    const seriesDefaults = SERIES_DEFAULTS[chartType];
    return deepClone(isFunction(seriesDefaults) ? seriesDefaults(options) : seriesDefaults);
}

export function getSeriesThemeTemplate(chartType: string): {} {
    if (hasRegisteredEnterpriseModules()) {
        return ENTERPRISE_SERIES_THEME_TEMPLATES[chartType];
    }
    return SERIES_THEME_TEMPLATES[chartType];
}

export function addSeriesPaletteFactory(seriesType: string, factory: SeriesPaletteFactory) {
    SERIES_PALETTE_FACTORIES[seriesType] = factory;
}

export function getSeriesPaletteFactory(seriesType: string) {
    return SERIES_PALETTE_FACTORIES[seriesType];
}

export function isSoloSeries(seriesType: SeriesOptionsTypes['type']) {
    return SOLO_SERIES_TYPES.has(seriesType);
}

export function isStackableSeries(seriesType: SeriesOptionsTypes['type']) {
    return STACKABLE_SERIES_TYPES.has(seriesType);
}

export function isGroupableSeries(seriesType: SeriesOptionsTypes['type']) {
    return GROUPABLE_SERIES_TYPES.has(seriesType);
}

export function isSeriesStackedByDefault(seriesType: string) {
    return STACKED_BY_DEFAULT_SERIES_TYPES.has(seriesType);
}

export function addGroupableSeriesType(seriesType: SeriesOptionsTypes['type']) {
    GROUPABLE_SERIES_TYPES.add(seriesType);
}

export function addSoloSeriesType(seriesType: SeriesOptionsTypes['type']) {
    SOLO_SERIES_TYPES.add(seriesType);
}

export function addStackableSeriesType(seriesType: SeriesOptionsTypes['type']) {
    STACKABLE_SERIES_TYPES.add(seriesType);
}

export function addStackedByDefaultSeriesType(seriesType: string) {
    STACKED_BY_DEFAULT_SERIES_TYPES.add(seriesType);
}

export function addSwapDefaultAxesCondition(seriesType: string, predicate: (opts: any) => boolean) {
    SWAP_DEFAULT_AXES_CONDITIONS[seriesType] = predicate;
}

export function isDefaultAxisSwapNeeded(opts: AgChartOptions) {
    let result: boolean | undefined;

    for (const series of opts.series ?? []) {
        const { type = 'line' } = series;
        const isDefaultAxisSwapped = SWAP_DEFAULT_AXES_CONDITIONS[type]?.(series);

        if (isDefaultAxisSwapped != null) {
            if (result != null && result != isDefaultAxisSwapped) {
                // TODO change to a warning
                throw new Error('AG Charts - The provided series have incompatible directions');
            }

            result = isDefaultAxisSwapped;
        }
    }

    return result;
}
