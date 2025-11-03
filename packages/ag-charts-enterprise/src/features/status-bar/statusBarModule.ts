import { VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition } from 'ag-charts-core';

import { StatusBar } from './statusBar';

export const StatusBarModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'statusBar',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    themeTemplate: {
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

    create: (ctx) => new StatusBar(ctx),
};
