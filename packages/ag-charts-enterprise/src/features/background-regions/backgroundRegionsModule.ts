import { SeriesAreaModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, arrayOfDefs } from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegion } from 'ag-charts-types';

import { BackgroundRegions } from './backgroundRegions';
import { backgroundRegionOptionsDef } from './backgroundRegionsOptionsDefs';
import { backgroundRegionsTheme } from './backgroundRegionsTheme';

export const BackgroundRegionsModule: PluginModuleDefinition<never, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'background-regions',
    chartTypes: ['cartesian'],
    enterprise: true,
    version: VERSION,
    dependencies: [SeriesAreaModule],
    contributes: [
        {
            path: 'seriesArea.backgroundRegions',
            options: arrayOfDefs<AgSeriesAreaBackgroundRegion>(backgroundRegionOptionsDef),
            themeOptions: backgroundRegionOptionsDef,
            themeTemplate: backgroundRegionsTheme,
        },
    ],
    create: (ctx) => new BackgroundRegions(ctx, ctx.moduleRegistry.moduleContributions(BackgroundRegionsModule.name)),
};
