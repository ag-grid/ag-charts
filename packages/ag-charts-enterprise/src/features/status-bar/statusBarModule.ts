import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { StatusBar } from './statusBar';

export const StatusBarModule: _ModuleSupport.RootModule = {
    type: 'root',
    identifier: 'status-bar',
    optionsKey: 'statusBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new StatusBar(ctx),
    themeTemplate: {
        statusBar: {
            enabled: false,
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
            neutral: {
                color: _Theme.PALETTE_NEUTRAL_STROKE,
            },
            background: {
                fill: _Theme.DEFAULT_BACKGROUND_COLOUR,
                fillOpacity: 0.5,
            },
            altNeutral: {
                color: 'gray',
            },
        },
    },
};
