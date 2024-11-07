import { _ModuleSupport } from 'ag-charts-community';

import { Navigator } from './navigator';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR } = _ModuleSupport.ThemeSymbols;

export const NavigatorModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new Navigator(ctx),
    removable: false, // Toggling this module causes zoom state flakiness.
    themeTemplate: {
        ..._ModuleSupport.NavigatorModule.themeTemplate,
        navigator: {
            ..._ModuleSupport.NavigatorModule.themeTemplate.navigator,
            miniChart: {
                enabled: false,
                label: {
                    color: DEFAULT_LABEL_COLOUR,
                    fontSize: 10,
                    fontFamily: DEFAULT_FONT_FAMILY,
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
