import { type AgWaterfallSeriesOptions, CartesianChartModule, VERSION } from 'ag-charts-community';
import { ChartAxisDirection, DIRECTION_SWAP_AXES, type SeriesModuleDefinition } from 'ag-charts-core';

import { WaterfallSeries } from './waterfallSeries';
import { waterfallSeriesOptionsDef } from './waterfallSeriesOptionsDef';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

export const WaterfallSeriesModule: SeriesModuleDefinition<AgWaterfallSeriesOptions> = {
    type: 'series',
    name: 'waterfall',
    chartType: 'cartesian',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: waterfallSeriesOptionsDef,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisKeysFlipped: { [ChartAxisDirection.X]: 'yKeyAxis', [ChartAxisDirection.Y]: 'xKeyAxis' },
    themeTemplate: WATERFALL_SERIES_THEME,

    create: (ctx) => new WaterfallSeries(ctx),
};
