import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { PyramidSeries } from './pyramidSeries';
import { pyramidSeriesOptionsDef } from './pyramidSeriesOptionsDef';
import { PYRAMID_SERIES_THEME } from './pyramidThemes';

export const PyramidModule: _ModuleSupport.SeriesModule<'pyramid'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],

    identifier: 'pyramid',
    moduleFactory: (ctx) => new PyramidSeries(ctx),
    solo: true,
    themeTemplate: PYRAMID_SERIES_THEME,
};

export const PyramidSeriesModule: SeriesModuleDefinition<AgPyramidSeriesOptions> = {
    type: 'series',
    name: 'pyramid',
    chartType: 'standalone',
    enterprise: true,

    options: pyramidSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new PyramidSeries(ctx),
};
