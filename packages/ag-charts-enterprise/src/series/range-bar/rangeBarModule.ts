import { type AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeBarSeries } from './rangeBarSeries';
import { rangeBarSeriesOptionsDef } from './rangeBarSeriesOptionsDef';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeBarModule: _ModuleSupport.SeriesModule<'range-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    moduleFactory: (ctx) => new RangeBarSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: 'number' }, { type: 'category' }],
    themeTemplate: RANGE_BAR_SERIES_THEME,
    groupable: true,
};

export const RangeBarSeriesModule: SeriesModuleDefinition<AgRangeBarSeriesOptions> = {
    type: 'series',
    name: 'range-bar',
    chartType: 'cartesian',
    enterprise: true,

    options: rangeBarSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RangeBarSeries(ctx),
};
