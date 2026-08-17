import { VERSION } from 'ag-charts-community';
import type { SeriesAreaPluginModuleDefinition } from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegion } from 'ag-charts-types';

import { BackgroundRegionsPlugin } from './backgroundRegionsPlugin';
import { backgroundRegionsTheme } from './backgroundRegionsTheme';
import { CartesianBackgroundRegion } from './cartesianBackgroundRegion';

export const BackgroundRegionsModule: SeriesAreaPluginModuleDefinition<AgSeriesAreaBackgroundRegion[]> = {
    type: 'series-area:plugin',
    name: 'backgroundRegions',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    themeTemplate: backgroundRegionsTheme,

    register: (ctx) => {
        ctx.factory('backgroundRegion', () => new CartesianBackgroundRegion());
    },
    create: (ctx) => new BackgroundRegionsPlugin(ctx),
};
