import { type AgChartToolbarThemeableOptions, type ChartRegistry, VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { ChartToolbar } from './chartToolbar';

export const ChartToolbarModule: PluginModuleDefinition<AgChartToolbarThemeableOptions, ChartRegistry> = {
    type: 'plugin',
    name: 'chartToolbar',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
    },

    create: (ctx) => new ChartToolbar(ctx),
    register: (ctx) => {
        if (ctx.has('sharedToolbar')) return;
        ctx.service('sharedToolbar', (c) => new SharedToolbar(c));
    },
};
