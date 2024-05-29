import type { _ModuleSupport } from 'ag-charts-community';

import { OrdinalTimeAxis } from './ordinalTimeAxis';

export const OrdinalTimeAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'ordinal-time',
    instanceConstructor: OrdinalTimeAxis,
};
