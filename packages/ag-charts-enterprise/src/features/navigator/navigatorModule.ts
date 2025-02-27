import { _ModuleSupport } from 'ag-charts-community';

import { Navigator } from './navigator';
import { NAVIGATOR_THEME } from './navigatorTheme';

export const NavigatorModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new Navigator(ctx),
    removable: false, // Toggling this module causes zoom state flakiness.
    themeTemplate: {
        navigator: NAVIGATOR_THEME,
    },
};
