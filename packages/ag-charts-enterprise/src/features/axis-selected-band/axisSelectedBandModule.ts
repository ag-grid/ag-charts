import { VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { AxisSelectedBand } from './axisSelectedBand';
import type { AxisSelectedBandOptions } from './axisSelectedBandTypes';

/**
 * Draws a band across the series area behind each category with a selected datum, in the series bound to the
 * axis. Presets switch it on; it has no public options. As with the other axis plugins, its option defs sit with
 * the axis in core (`categoryAxisOptionsDefs`).
 */
export const AxisSelectedBandModule: AxisPluginModuleDefinition<AxisSelectedBandOptions> = {
    type: 'axis:plugin',
    name: 'axisSelectedBand',
    chartTypes: ['cartesian'],
    axisTypes: ['category'],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        fill: { $palette: 'neutral.fill' },
        fillOpacity: 0.2,
        strokeWidth: 0,
    },

    create: (ctx) => new AxisSelectedBand(ctx),
};
