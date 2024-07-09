import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { Crosshair } from './crosshair';

export const CrosshairModule: _ModuleSupport.AxisOptionModule = {
    type: 'axis-option',
    optionsKey: 'crosshair',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'ordinal-time', 'number', 'log', 'time'],
    instanceConstructor: Crosshair,
    themeTemplate: {
        crosshair: {
            snap: true,
            stroke: _Theme.DEFAULT_MUTED_LABEL_COLOUR,
            strokeWidth: 1,
            strokeOpacity: 1,
            lineDash: [5, 6],
            lineDashOffset: 0,
            label: {
                enabled: true,
            },
        },
    },
};
