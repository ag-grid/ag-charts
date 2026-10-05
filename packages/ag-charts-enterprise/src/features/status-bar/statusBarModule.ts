import { VERSION } from 'ag-charts-community';
import { FONT_THEME_DEFAULTS, type PluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { StatusBar } from './statusBar';

export const StatusBarModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'statusBar',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        layoutStyle: { $ref: 'captionLayoutStyle' },
        title: {
            color: { $ref: 'textColor' },
            ...FONT_THEME_DEFAULTS,
        },
        positive: {
            color: { $palette: 'up.stroke' },
            ...FONT_THEME_DEFAULTS,
        },
        negative: {
            color: { $palette: 'down.stroke' },
            ...FONT_THEME_DEFAULTS,
        },
        neutral: {
            color: { $palette: 'neutral.stroke' },
            ...FONT_THEME_DEFAULTS,
        },
        background: {
            fill: { $ref: 'chartBackgroundColor' },
            fillOpacity: 0.5,
        },
        altNeutral: {
            color: 'gray',
            ...FONT_THEME_DEFAULTS,
        },
    },

    create: (ctx) => new StatusBar(ctx),
};
