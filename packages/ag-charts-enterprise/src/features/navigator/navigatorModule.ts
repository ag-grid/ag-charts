import type { AgNavigatorOptions } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { Navigator } from './navigator';
import { navigatorOptionsDef } from './navigatorOptionsDefs';
import { NAVIGATOR_THEME } from './navigatorTheme';

export const NavigatorModule: PluginModuleDefinition<AgNavigatorOptions> = {
    type: 'plugin',
    name: 'navigator',
    chartType: 'cartesian',
    enterprise: true,
    // removable: false, // Toggling this module causes zoom state flakiness.

    options: navigatorOptionsDef,
    themeTemplate: NAVIGATOR_THEME,

    create: (ctx) => new Navigator(ctx),
};
