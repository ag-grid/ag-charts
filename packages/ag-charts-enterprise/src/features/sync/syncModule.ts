import { type AgChartSyncOptions, VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, string, union } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { ChartSync } from './chartSync';

export const SyncModule: PluginModuleDefinition<AgChartSyncOptions> = {
    type: 'plugin',
    name: 'sync',
    chartType: 'cartesian',
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        groupId: string,
        axes: union('x', 'y', 'xy'),
        nodeInteraction: boolean,
        zoom: boolean,
    },
    themeTemplate: { enabled: false, axes: 'x', nodeInteraction: true, zoom: true },

    create: (ctx) => new ChartSync(ctx),
};
