import type { _ModuleSupport } from 'ag-charts-community';

import { RadiusNumberAxis } from './radiusNumberAxis';

export const RadiusNumberAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-number',
    instanceConstructor: RadiusNumberAxis,
};
