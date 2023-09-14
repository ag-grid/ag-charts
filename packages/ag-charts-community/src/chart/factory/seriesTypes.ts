import type { Series } from '../series/series';
import { AreaSeries } from '../series/cartesian/areaSeries';
import { BarSeries } from '../series/cartesian/barSeries';
import { HistogramSeries } from '../series/cartesian/histogramSeries';
import { LineSeries } from '../series/cartesian/lineSeries';
import { ScatterSeries } from '../series/cartesian/scatterSeries';
import { PieSeries } from '../series/polar/pieSeries';
import { TreemapSeries } from '../series/hierarchy/treemapSeries';
import type { ChartType } from './chartTypes';
import { registerChartSeriesType } from './chartTypes';
import type { SeriesConstructor, SeriesPaletteFactory } from '../../util/module';
import type { ModuleContext } from '../../util/moduleContext';
import type { AgBarSeriesOptions, AgChartOptions } from '../../options/agChartOptions';

const BUILT_IN_SERIES_FACTORIES: Record<string, SeriesConstructor> = {
    area: AreaSeries,
    bar: BarSeries,
    histogram: HistogramSeries,
    line: LineSeries,
    pie: PieSeries,
    scatter: ScatterSeries,
    treemap: TreemapSeries,
};

const SERIES_FACTORIES: Record<string, SeriesConstructor> = {};
const SERIES_DEFAULTS: Record<string, any> = {};
const SERIES_THEME_TEMPLATES: Record<string, {}> = {};
const SERIES_PALETTE_FACTORIES: Record<string, SeriesPaletteFactory> = {};
const STACKABLE_SERIES_TYPES = new Set(['bar', 'area']);
const GROUPABLE_SERIES_TYPES = new Set(['bar']);
const STACKED_BY_DEFAULT_SERIES_TYPES = new Set<string>();
const SWAP_DEFAULT_AXES_CONDITIONS: Record<string, (opts: AgChartOptions) => boolean> = {
    bar: (opts) => (opts.series?.[0] as AgBarSeriesOptions)?.direction !== 'horizontal',
};

export function registerSeries(
    seriesType: string,
    chartType: ChartType,
    cstr: SeriesConstructor,
    defaults: {},
    theme: {},
    paletteFactory: SeriesPaletteFactory | undefined,
    stackable: boolean | undefined,
    groupable: boolean | undefined,
    stackedByDefault: boolean | undefined,
    swapDefaultAxesCondition: ((opts: AgChartOptions) => boolean) | undefined
) {
    SERIES_FACTORIES[seriesType] = cstr;
    SERIES_DEFAULTS[seriesType] = defaults;
    SERIES_THEME_TEMPLATES[seriesType] = theme;
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
    const seriesConstructor = SERIES_FACTORIES[chartType] ?? BUILT_IN_SERIES_FACTORIES[chartType];
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

export function addSeriesPaletteFactory(seriesType: string, factory: SeriesPaletteFactory) {
    SERIES_PALETTE_FACTORIES[seriesType] = factory;
}

export function getSeriesPaletteFactory(seriesType: string) {
    return SERIES_PALETTE_FACTORIES[seriesType];
}

export function isStackableSeries(seriesType: string) {
    return STACKABLE_SERIES_TYPES.has(seriesType);
}

export function isGroupableSeries(seriesType: string) {
    return GROUPABLE_SERIES_TYPES.has(seriesType);
}

export function isSeriesStackedByDefault(seriesType: string) {
    return STACKED_BY_DEFAULT_SERIES_TYPES.has(seriesType);
}

export function addGroupableSeriesType(seriesType: string) {
    GROUPABLE_SERIES_TYPES.add(seriesType);
}

export function addStackableSeriesType(seriesType: string) {
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
