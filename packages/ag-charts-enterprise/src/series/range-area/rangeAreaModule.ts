import { type AgRangeAreaSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection, type SeriesModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';
import { RangeAreaSeries } from './rangeArea';
import { rangeAreaSeriesOptionsDef, rangeAreaSeriesThemeableOptionsDef } from './rangeAreaSeriesOptionsDef';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const { predictCartesianNonPrimitiveAxis } = _ModuleSupport;

export const RangeAreaSeriesModule: SeriesModuleDefinition<AgRangeAreaSeriesOptions> = {
    type: 'series',
    name: 'range-area',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule, BackgroundRegionsModule],

    options: rangeAreaSeriesOptionsDef,

    themeOptions: rangeAreaSeriesThemeableOptionsDef,
    matchingKeys: ['xKey', 'yLowKey', 'yHighKey', 'normalizedTo'],
    predictAxis: predictCartesianNonPrimitiveAxis,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate: RANGE_AREA_SERIES_THEME,

    create: (ctx) => new RangeAreaSeries(ctx),
};
