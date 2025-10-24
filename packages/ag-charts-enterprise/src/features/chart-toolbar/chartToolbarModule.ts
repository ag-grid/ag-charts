import type { AgChartToolbarThemeableOptions } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { ChartToolbar } from './chartToolbar';

export const ChartToolbarModule: PluginModuleDefinition<AgChartToolbarThemeableOptions> = {
    type: 'plugin',
    name: 'chartToolbar',
    chartType: 'cartesian',
    enterprise: true,

    options: {
        enabled: boolean,
    },

    create: (ctx) => new ChartToolbar(ctx),
    patchContext: (ctx) => {
        if (ctx.sharedToolbar) return;
        ctx.sharedToolbar = new SharedToolbar(ctx);
        ctx.cleanup.register(() => ctx.sharedToolbar.destroy());
    },
};
