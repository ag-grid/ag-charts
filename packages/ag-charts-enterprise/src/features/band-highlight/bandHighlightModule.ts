import type { AgBandHighlightOptions } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { BandHighlight } from './bandHighlight';

export const BandHighlightModule: AxisPluginModuleDefinition<AgBandHighlightOptions> = {
    type: 'axis:plugin',
    name: 'bandHighlight',
    chartType: 'cartesian',
    axisTypes: ['category', 'ordinal-time', 'unit-time', 'grouped-category'],
    enterprise: true,

    themeTemplate: {
        bandHighlight: {
            enabled: false,
            strokeWidth: 0,
            lineDash: [],
            fill: { $foregroundBackgroundMix: 0.05 },
        },
    },

    create: (ctx) => new BandHighlight(ctx),
};
