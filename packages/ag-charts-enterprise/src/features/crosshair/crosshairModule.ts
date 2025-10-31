import { type AgCrosshairOptions, VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { Crosshair } from './crosshair';

export const CrosshairModule: AxisPluginModuleDefinition<AgCrosshairOptions> = {
    type: 'axis:plugin',
    name: 'crosshair',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        crosshair: {
            snap: true,
            stroke: { $ref: 'subtleTextColor' },
            strokeWidth: 1,
            strokeOpacity: 1,
            lineDash: [5, 6],
            lineDashOffset: 0,
            label: {
                enabled: true,
            },
        },
    },

    create: (ctx) => new Crosshair(ctx),
};
