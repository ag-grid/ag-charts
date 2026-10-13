import { VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { AxisInsetValue } from './axisInsetValue';
import type { AxisInsetValueOptions } from './axisInsetValueTypes';

/**
 * Reserves a fixed-width strip between an axis position and the series area, and fills it with one
 * labelled block per category, valued from the data of the series bound to the axis. Presets switch it
 * on and supply the keys; it has no public options. As with the other axis plugins, its option defs sit with the
 * axis in community (`categoryAxisOptionsDefs`).
 */
export const AxisInsetValueModule: AxisPluginModuleDefinition<AxisInsetValueOptions> = {
    type: 'axis:plugin',
    name: 'axisInsetValue',
    chartTypes: ['cartesian'],
    axisTypes: ['category'],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        position: 'left',
        minWidth: 60,
        fill: { $palette: 'neutral.fill' },
        fillOpacity: 1,
        label: {
            enabled: true,
            color: 'white',
            fontFamily: { $ref: 'fontFamily' },
            fontSize: { $ref: 'fontSize' },
            fontWeight: { $ref: 'fontWeight' },
            padding: 8,
        },
    },

    create: (ctx) => new AxisInsetValue(ctx),
};
