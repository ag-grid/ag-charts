import { type AgPyramidSeriesOptions, VERSION, type _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { PyramidSeries } from './pyramidSeries';
import { pyramidSeriesOptionsDef } from './pyramidSeriesOptionsDef';
import { PYRAMID_SERIES_THEME } from './pyramidThemes';

export const PyramidSeriesModule: SeriesModuleDefinition<AgPyramidSeriesOptions> = {
    type: 'series',
    name: 'pyramid',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,

    options: pyramidSeriesOptionsDef,
    themeTemplate: PYRAMID_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new PyramidSeries(ctx),
};
