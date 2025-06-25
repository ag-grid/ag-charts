import type { _ModuleSupport } from 'ag-charts-community';

import { BandHighlight } from './bandHighlight';

export const BandHighlightModule: _ModuleSupport.AxisOptionModule = {
    type: 'axis-option',
    optionsKey: 'bandHighlight',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'ordinal-time', 'unit-time', 'grouped-category'],
    moduleFactory: (ctx) => new BandHighlight(ctx),
    themeTemplate: {
        bandHighlight: {
            enabled: false,
            strokeWidth: 0,
            lineDash: [],
            fill: { $foregroundBackgroundMix: 0.05 },
        },
    },
};
