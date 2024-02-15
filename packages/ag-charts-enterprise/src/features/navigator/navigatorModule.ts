import { _ModuleSupport, _Theme } from 'ag-charts-community';

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
                    color: _Theme.DEFAULT_LABEL_COLOUR,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 10,
                    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
                    formatter: undefined,
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
