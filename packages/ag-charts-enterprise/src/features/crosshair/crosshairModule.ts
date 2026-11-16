import { type AgCrosshairOptions, VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { Crosshair } from './crosshair';

export const CrosshairModule: AxisPluginModuleDefinition<AgCrosshairOptions> = {
    type: 'axis:plugin',
    name: 'crosshair',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        stroke: { $ref: 'subtleTextColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        lineDash: [5, 6],
        lineDashOffset: 0,
        label: {
            enabled: true,
            xOffset: 0,
            yOffset: 0,
        },
    },

    create: (ctx) => new Crosshair(ctx),
};
