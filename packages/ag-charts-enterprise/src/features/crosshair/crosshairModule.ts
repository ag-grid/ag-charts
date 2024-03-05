import type { _ModuleSupport } from 'ag-charts-community';

import { Crosshair } from './crosshair';
import { AXIS_CROSSHAIR_THEME } from './crosshairTheme';

export const CrosshairModule: _ModuleSupport.AxisOptionModule = {
    type: 'axis-option',
    optionsKey: 'crosshair',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'ordinal-time', 'number', 'log', 'time'],
    instanceConstructor: Crosshair,
    themeTemplate: AXIS_CROSSHAIR_THEME,
};
