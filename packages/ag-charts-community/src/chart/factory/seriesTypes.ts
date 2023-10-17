import type { SeriesConstructor, SeriesPaletteFactory } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import type { AgChartOptions } from '../../options/agChartOptions';
import type { SeriesOptionsTypes } from '../mapping/types';
import type { Series } from '../series/series';
import type { ChartType } from './chartTypes';
import { registerChartSeriesType } from './chartTypes';

const SERIES_FACTORIES: Record<string, SeriesConstructor> = {};
const SERIES_DEFAULTS: Record<string, any> = {};
const SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const SERIES_PALETTE_FACTORIES: Record<string, SeriesPaletteFactory> = {};
const STACKABLE_SERIES_TYPES = new Set<SeriesOptionsTypes['type']>();
const GROUPABLE_SERIES_TYPES = new Set<SeriesOptionsTypes['type']>();
const STACKED_BY_DEFAULT_SERIES_TYPES = new Set<string>();
const SWAP_DEFAULT_AXES_CONDITIONS: Record<string, (opts: AgChartOptions) => boolean> = {};
const SERIES_SWAPPED_AXES_DEFAULTS: Record<string, {} | undefined> = {};

export function registerSeries(
    seriesType: NonNullable<SeriesOptionsTypes['type']>,
    chartType: ChartType,
    cstr: SeriesConstructor,
    defaults: {},
    theme: {},
    paletteFactory: SeriesPaletteFactory | undefined,
    stackable: boolean | undefined,
    groupable: boolean | undefined,
    stackedByDefault: boolean | undefined,
    swapDefaultAxesCondition: ((opts: AgChartOptions) => boolean) | undefined,
    swappedAxesDefaults: {} | undefined
) {
    SERIES_FACTORIES[seriesType] = cstr;
    SERIES_DEFAULTS[seriesType] = defaults;
    SERIES_THEME_TEMPLATES[seriesType] = theme;
    SERIES_SWAPPED_AXES_DEFAULTS[seriesType] = swappedAxesDefaults;
    if (paletteFactory) {
        addSeriesPaletteFactory(seriesType, paletteFactory);
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

export function getSeries(chartType: string, moduleCtx: ModuleContext): Series<any> {
    const seriesConstructor = SERIES_FACTORIES[chartType];
    if (seriesConstructor) {
        return new seriesConstructor(moduleCtx);
    }

    throw new Error(`AG Charts - unknown series type: ${chartType}`);
}

export function getSeriesDefaults(chartType: string): {} {
    return SERIES_DEFAULTS[chartType];
}

export function getSeriesThemeTemplate(chartType: string): {} {
    return SERIES_THEME_TEMPLATES[chartType];
}

export function getSeriesSwappedAxesDefaults(chartType: string) {
    return SERIES_SWAPPED_AXES_DEFAULTS[chartType];
}

export function addSeriesPaletteFactory(seriesType: string, factory: SeriesPaletteFactory) {
    SERIES_PALETTE_FACTORIES[seriesType] = factory;
}

export function getSeriesPaletteFactory(seriesType: string) {
    return SERIES_PALETTE_FACTORIES[seriesType];
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

export function addStackableSeriesType(seriesType: SeriesOptionsTypes['type']) {
    STACKABLE_SERIES_TYPES.add(seriesType);
}

export function addStackedByDefaultSeriesType(seriesType: string) {
    STACKED_BY_DEFAULT_SERIES_TYPES.add(seriesType);
}

export function addSwapDefaultAxesCondition(seriesType: string, predicate: (opts: AgChartOptions) => boolean) {
    SWAP_DEFAULT_AXES_CONDITIONS[seriesType] = predicate;
}

export function isDefaultAxisSwapNeeded(opts: AgChartOptions) {
    const { type } = opts.series?.[0] ?? {};

    if (type != null && SWAP_DEFAULT_AXES_CONDITIONS[type]) {
        return SWAP_DEFAULT_AXES_CONDITIONS[type](opts);
    }

    return false;
}
