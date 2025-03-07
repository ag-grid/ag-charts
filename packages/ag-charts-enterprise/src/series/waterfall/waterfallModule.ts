import { type AgWaterfallSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { WaterfallSeries } from './waterfallSeries';
import { waterfallSeriesOptionsDef } from './waterfallSeriesOptionsDef';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

const { ThemeConstants } = _ModuleSupport;

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    solo: true,
    moduleFactory: (ctx) => new WaterfallSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _ModuleSupport.swapAxisCondition(
        [
            { type: ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER, position: ThemeConstants.CARTESIAN_POSITION.LEFT },
            { type: ThemeConstants.CARTESIAN_AXIS_TYPE.CATEGORY, position: ThemeConstants.CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
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
