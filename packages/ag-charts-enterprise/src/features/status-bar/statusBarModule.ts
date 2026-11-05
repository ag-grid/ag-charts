import { VERSION } from 'ag-charts-community';
import { FONT_THEME_DEFAULTS, type PluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { StatusBar } from './statusBar';
import { statusBarOptionsDefs } from './statusBarOptionsDefs';

const statusBarTheme = {
    enabled: false,
    layoutStyle: { $ref: 'captionLayoutStyle' },
    fill: { $ref: 'chartBackgroundColor' },
    fillOpacity: 0.5,
    border: { enabled: false, strokeWidth: 1, stroke: { $foregroundOpacity: 0.08 } },
    cornerRadius: 0,
    padding: 0,
    wrapping: 'on-space',
    truncate: true,
    inactive: 'last',
    label: {
        color: { $ref: 'textColor' },
        ...FONT_THEME_DEFAULTS,
    },
    value: FONT_THEME_DEFAULTS,
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
    altNeutral: {
        color: 'gray',
        ...FONT_THEME_DEFAULTS,
    },
};

export const StatusBarModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'statusBar',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,
    options: statusBarOptionsDefs,
    themeTemplate: statusBarTheme,

    create: (ctx) => new StatusBar(ctx),
};
