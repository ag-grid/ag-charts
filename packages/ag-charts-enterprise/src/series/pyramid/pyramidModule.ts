import { type AgPyramidSeriesOptions, StandaloneChartModule, VERSION } from 'ag-charts-community';
import { LABEL_MANAGER_SERVICES } from 'ag-charts-core';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { PyramidSeries } from './pyramidSeries';
import { pyramidSeriesOptionsDef, pyramidSeriesThemeableOptionsDef } from './pyramidSeriesOptionsDef';
import { PYRAMID_SERIES_THEME } from './pyramidThemes';

export const PyramidSeriesModule: SeriesModuleDefinition<AgPyramidSeriesOptions> = {
    type: 'series',
    name: 'pyramid',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],
    services: LABEL_MANAGER_SERVICES,

    options: pyramidSeriesOptionsDef,

    themeOptions: pyramidSeriesThemeableOptionsDef,
    themeTemplate: PYRAMID_SERIES_THEME,

    create: (ctx) => new PyramidSeries(ctx),
};
