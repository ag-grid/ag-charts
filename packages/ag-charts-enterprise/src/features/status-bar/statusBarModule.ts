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
                color: { $ref: 'foregroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
            },
            positive: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_UP_STROKE,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
            },
            negative: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_DOWN_STROKE,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
            },
            neutral: {
                color: _ModuleSupport.ThemeSymbols.PALETTE_NEUTRAL_STROKE,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
            },
            background: {
                fill: { $ref: 'backgroundColor' },
                fillOpacity: 0.5,
            },
            altNeutral: {
                color: 'gray',
            },
        },
    },
};
