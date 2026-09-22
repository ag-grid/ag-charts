import { type AgBandHighlightOptions, VERSION } from 'ag-charts-community';
import type { AxisPluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { BandHighlight } from './bandHighlight';

export const BandHighlightModule: AxisPluginModuleDefinition<AgBandHighlightOptions> = {
    type: 'axis:plugin',
    name: 'bandHighlight',
    chartTypes: ['cartesian'],
    dependencies: [BackgroundRegionsModule],
    axisTypes: ['category', 'ordinal-time', 'unit-time', 'grouped-category'],
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        enabled: false,
        stroke: 'rgb(195, 195, 195)',
        strokeWidth: 0,
        strokeOpacity: 1,
        lineDash: [],
        lineDashOffset: 0,
        fill: { $foregroundBackgroundMix: 0.05 },
        fillOpacity: 1,
    },

    create: (ctx) => new BandHighlight(ctx),
};
