import { type AgRangeBarSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeBarSeries } from './rangeBarSeries';
import { rangeBarSeriesOptionsDef } from './rangeBarSeriesOptionsDef';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

const { DIRECTION_SWAP_AXES, ChartAxisDirection, predictCartesianNonPrimitiveAxis } = _ModuleSupport;

export const RangeBarSeriesModule: SeriesModuleDefinition<AgRangeBarSeriesOptions> = {
    type: 'series',
    name: 'range-bar',
    chartType: 'cartesian',
    enterprise: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: rangeBarSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisValueKeys: { [ChartAxisDirection.X]: 'xKey', [ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'] },
    themeTemplate: RANGE_BAR_SERIES_THEME,

    create: (ctx) => new RangeBarSeries(ctx),
};
