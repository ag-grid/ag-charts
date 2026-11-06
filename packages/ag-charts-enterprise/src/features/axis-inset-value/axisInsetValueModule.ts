import { VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';
import { themeLineHeight } from 'ag-charts-core';

import { AxisInsetValue } from './axisInsetValue';
import type { AxisInsetValueOptions } from './axisInsetValueTypes';

/**
 * Reserves a fixed-width strip between an axis position and the series area, and fills it with one
 * labelled block per level, valued from the data of the series bound to the axis. Presets switch it
 * on and supply the keys; it has no public options. As with the other axis plugins, its option defs sit with the
 * axes in community (`categoryAxisOptionsDefs`, `numberAxisOptionsDefs`).
 */
export const AxisInsetValueModule: AxisPluginModuleDefinition<AxisInsetValueOptions> = {
    type: 'axis:plugin',
    name: 'axisInsetValue',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'number'],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        position: 'left',
        minWidth: 60,
        gap: 2,
        fill: { $palette: 'neutral.fill' },
        fillOpacity: 1,
        label: {
            enabled: true,
            color: 'white',
            fontFamily: { $ref: 'fontFamily' },
            fontSize: { $ref: 'fontSize' },
            lineHeight: themeLineHeight('lineHeight'),
            fontWeight: { $ref: 'fontWeight' },
            padding: 8,
        },
    },

    create: (ctx) => new AxisInsetValue(ctx),
};
