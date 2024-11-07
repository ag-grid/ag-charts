import { _ModuleSupport } from 'ag-charts-community';

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
            layoutStyle: _ModuleSupport.ThemeSymbols.DEFAULT_CAPTION_LAYOUT_STYLE,
            title: {
                color: _ModuleSupport.ThemeSymbols.DEFAULT_LABEL_COLOUR,
            },
            positive: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_UP_STROKE,
            },
            negative: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_DOWN_STROKE,
            },
            neutral: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_NEUTRAL_STROKE,
            },
            background: {
                fill: _ModuleSupport.ThemeSymbols.DEFAULT_BACKGROUND_COLOUR,
                fillOpacity: 0.5,
            },
            altNeutral: {
                color: 'gray',
            },
        },
    },
};
