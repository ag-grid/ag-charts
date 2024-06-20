import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { StatusBar } from './statusBar';

export const StatusBarModule: _ModuleSupport.RootModule = {
    type: 'root',
    identifier: 'status-bar',
    optionsKey: 'statusBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: StatusBar,
    themeTemplate: {
        statusBar: {
            enabled: false,
            title: {
                color: _Theme.DEFAULT_LABEL_COLOUR,
            },
            positive: {
                color: 'green',
            },
            negative: {
                color: 'red',
            },
        },
    },
};
