import { type AgPyramidSeriesOptions, VERSION } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
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
    dependencies: [StandaloneChartModule],

    options: pyramidSeriesOptionsDef,
    themeTemplate: PYRAMID_SERIES_THEME,

    create: (ctx) => new PyramidSeries(ctx),
};
