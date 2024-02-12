import { _ModuleSupport } from 'ag-charts-community';

import { Navigator } from './navigator';

export const NavigatorModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Navigator,
    themeTemplate: {
        ..._ModuleSupport.NavigatorModule.themeTemplate,
        navigator: {
            ...(_ModuleSupport.NavigatorModule.themeTemplate as any)?.navigator,
            miniChart: {
                enabled: false,
                label: {
                    fontSize: 10,
                    padding: 0,
                },
                padding: {
                    top: 0,
                    bottom: 0,
                },
            },
        },
    },
};
