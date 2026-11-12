import { type AgChartSyncOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, string, union } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { ChartSync, type SyncCtx } from './chartSync';

export const SyncModule: PluginModuleDefinition<AgChartSyncOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'sync',
    chartTypes: ['cartesian'],
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

    // `services` install `syncManager` before `create` runs, so narrowing to SyncCtx is safe.
    create: (ctx) => new ChartSync(ctx as SyncCtx),
    services: { syncManager: (c) => new _ModuleSupport.SyncManager(c) },
};
