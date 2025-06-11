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
                color: { $ref: 'textColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
            },
            positive: {
                color: { $palette: 'up.stroke' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
            },
            negative: {
                color: { $palette: 'down.stroke' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
            },
            neutral: {
                color: { $palette: 'neutral.stroke' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
            },
            background: {
                fill: { $ref: 'chartBackgroundColor' },
                fillOpacity: 0.5,
            },
            altNeutral: {
                color: 'gray',
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
            },
        },
    },
};
