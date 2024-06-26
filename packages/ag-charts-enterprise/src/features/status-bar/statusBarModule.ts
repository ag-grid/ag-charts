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
            openKey: undefined,
            highKey: undefined,
            lowKey: undefined,
            closeKey: undefined,
            volumeKey: undefined,
            layoutStyle: _Theme.DEFAULT_CAPTION_LAYOUT_STYLE,
            title: {
                color: _Theme.DEFAULT_LABEL_COLOUR,
            },
            positive: {
                color: _Theme.PALETTE_UP_STROKE,
            },
            negative: {
                color: _Theme.PALETTE_DOWN_STROKE,
            },
        },
    },
};
