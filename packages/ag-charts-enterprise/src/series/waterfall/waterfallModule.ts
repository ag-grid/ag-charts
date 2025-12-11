import { type AgWaterfallSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { ChartAxisDirection } from 'ag-charts-core';

import { WaterfallSeries } from './waterfallSeries';
import { waterfallSeriesOptionsDef } from './waterfallSeriesOptionsDef';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

const { DIRECTION_SWAP_AXES } = _ModuleSupport;

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
