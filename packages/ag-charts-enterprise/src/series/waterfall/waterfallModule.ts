import { type AgWaterfallSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { WaterfallSeries } from './waterfallSeries';
import { waterfallSeriesOptionsDef } from './waterfallSeriesOptionsDef';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    solo: true,
    moduleFactory: (ctx) => new WaterfallSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: 'number' }, { type: 'category' }],
    themeTemplate: WATERFALL_SERIES_THEME,
};

export const WaterfallSeriesModule: SeriesModuleDefinition<AgWaterfallSeriesOptions> = {
    type: 'series',
    name: 'waterfall',
    chartType: 'cartesian',
    enterprise: true,

    options: waterfallSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new WaterfallSeries(ctx),
};
