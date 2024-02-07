import type { SeriesConstructor, SeriesModule } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import { hasRegisteredEnterpriseModules } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type {
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
} from '../../options/agChartOptions';
import { deepClone } from '../../sparklines-util';
import { mergeDefaults } from '../../util/object';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { registerChartSeriesType } from './chartTypes';

export type SeriesOptions = AgCartesianSeriesOptions | AgPolarSeriesOptions | AgHierarchySeriesOptions;

const SERIES_FACTORIES: Record<string, SeriesConstructor> = {};
const SERIES_DEFAULTS: Record<string, any> = {};
const SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const ENTERPRISE_SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const SERIES_PALETTE_FACTORIES: Record<string, SeriesPaletteFactory> = {};
const SOLO_SERIES_TYPES = new Set<SeriesType>();
const STACKABLE_SERIES_TYPES = new Set<SeriesType>();
const GROUPABLE_SERIES_TYPES = new Set<SeriesType>();
const STACKED_BY_DEFAULT_SERIES_TYPES = new Set<SeriesType>();
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
    seriesType: NonNullable<SeriesType>,
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

export function getSeries(chartType: string, moduleCtx: ModuleContext): ISeries<any> {
    const seriesConstructor = SERIES_FACTORIES[chartType];
    if (seriesConstructor) {
        return new seriesConstructor(moduleCtx);
    }

    throw new Error(`AG Charts - unknown series type: ${chartType}`);
}

export function getSeriesDefaults<T extends AgChartOptions>(chartType: string): T {
    return deepClone(SERIES_DEFAULTS[chartType] ?? {});
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

export function isSoloSeries(seriesType: SeriesType) {
    return SOLO_SERIES_TYPES.has(seriesType);
}

export function isStackableSeries(seriesType: SeriesType) {
    return STACKABLE_SERIES_TYPES.has(seriesType);
}

export function isGroupableSeries(seriesType: SeriesType) {
    return GROUPABLE_SERIES_TYPES.has(seriesType);
}

export function isSeriesStackedByDefault(seriesType: SeriesType) {
    return STACKED_BY_DEFAULT_SERIES_TYPES.has(seriesType);
}

export function addGroupableSeriesType(seriesType: SeriesType) {
    GROUPABLE_SERIES_TYPES.add(seriesType);
}

export function addSoloSeriesType(seriesType: SeriesType) {
    SOLO_SERIES_TYPES.add(seriesType);
}

export function addStackableSeriesType(seriesType: SeriesType) {
    STACKABLE_SERIES_TYPES.add(seriesType);
}

export function addStackedByDefaultSeriesType(seriesType: SeriesType) {
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
