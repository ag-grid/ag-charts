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
    themeTemplate: WATERFALL_SERIES_THEME,
};

export const WaterfallSeriesModule: SeriesModuleDefinition<AgWaterfallSeriesOptions> = {
    type: 'series',
    name: 'waterfall',
    chartType: 'cartesian',
    enterprise: true,
    solo: true,

    options: waterfallSeriesOptionsDef,
    defaultAxes: _ModuleSupport.DIRECTION_SWAP_AXES,
    themeTemplate: WATERFALL_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new WaterfallSeries(ctx),
};
