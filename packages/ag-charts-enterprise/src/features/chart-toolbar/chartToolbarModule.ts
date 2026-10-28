import { type AgChartToolbarThemeableOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, positiveNumber } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { SharedToolbar } from '../shared-toolbar/sharedToolbar';
import { ChartToolbar } from './chartToolbar';

export const ChartToolbarModule: PluginModuleDefinition<AgChartToolbarThemeableOptions, _ModuleSupport.ChartRegistry> =
    {
        type: 'plugin',
        name: 'chartToolbar',
        chartTypes: ['cartesian'],
        dependencies: [BackgroundRegionsModule],
        enterprise: true,
        version: VERSION,

        options: {
            enabled: boolean,
            buttonSize: positiveNumber,
        },
        themeTemplate: { enabled: false },

        create: (ctx) => new ChartToolbar(ctx),
        services: { sharedToolbar: (c) => new SharedToolbar(c) },
    };
