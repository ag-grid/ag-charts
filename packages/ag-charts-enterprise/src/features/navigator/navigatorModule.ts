import { type AgNavigatorOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { Navigator } from './navigator';
import { navigatorOptionsDef } from './navigatorOptionsDefs';
import { NAVIGATOR_THEME } from './navigatorTheme';

export const NavigatorModule: PluginModuleDefinition<AgNavigatorOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'navigator',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    // removable: false, // Toggling this module causes zoom state flakiness.

    options: navigatorOptionsDef,
    themeTemplate: NAVIGATOR_THEME,

    create: (ctx) => new Navigator(ctx),
    register: (ctx) => {
        if (ctx.has('zoomManager')) return;
        ctx.service('zoomManager', (c) => new _ModuleSupport.ZoomManager(c));
    },
};
