import { type AgRangeBarSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeBarSeries } from './rangeBarSeries';
import { rangeBarSeriesOptionsDef } from './rangeBarSeriesOptionsDef';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeBarSeriesModule: SeriesModuleDefinition<AgRangeBarSeriesOptions> = {
    type: 'series',
    name: 'range-bar',
    chartType: 'cartesian',
    enterprise: true,
    groupable: true,
    version: VERSION,

    options: rangeBarSeriesOptionsDef,
    predictAxis: _ModuleSupport.predictCartesianTimeAxis,
    defaultAxes: _ModuleSupport.DIRECTION_SWAP_AXES,
    themeTemplate: RANGE_BAR_SERIES_THEME,

    create: (ctx) => new RangeBarSeries(ctx),
};
