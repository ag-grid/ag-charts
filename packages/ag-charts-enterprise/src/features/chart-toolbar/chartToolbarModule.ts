import { type AgChartToolbarThemeableOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean } from 'ag-charts-core';

import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { ChartToolbar } from './chartToolbar';

export const ChartToolbarModule: PluginModuleDefinition<AgChartToolbarThemeableOptions, _ModuleSupport.ChartRegistry> =
    {
        type: 'plugin',
        name: 'chartToolbar',
        chartType: 'cartesian',
        enterprise: true,
        version: VERSION,

        options: {
            enabled: boolean,
        },
        themeTemplate: { enabled: false },

        create: (ctx) => new ChartToolbar(ctx),
        register: (ctx) => {
            if (ctx.has('sharedToolbar')) return;
            ctx.service('sharedToolbar', (c) => new SharedToolbar(c));
        },
    };
