import { _ModuleSupport } from 'ag-charts-community';

import { BandHighlight } from './bandHighlight';

export const BandHighlightModule: _ModuleSupport.AxisOptionModule = {
    type: 'axis-option',
    optionsKey: 'bandHighlight',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'ordinal-time', 'time', 'grouped-category'],
    moduleFactory: (ctx) => new BandHighlight(ctx),
    themeTemplate: {
        bandHighlight: {
            strokeWidth: 0,
            lineDash: [],
            fill: {
                $foregroundBackgroundMix: [0.95],
            },
        },
    },
};
