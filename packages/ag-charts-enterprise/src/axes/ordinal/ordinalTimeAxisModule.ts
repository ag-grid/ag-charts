import type { _ModuleSupport } from 'ag-charts-community';

import { OrdinalTimeAxis } from './ordinalTimeAxis';
import { ORDINAL_TIME_AXIS_THEME } from './ordinalTimeAxisThemes';

export const OrdinalTimeAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    hidden: true,

    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'ordinal-time',
    instanceConstructor: OrdinalTimeAxis,
    themeTemplate: ORDINAL_TIME_AXIS_THEME,
};
