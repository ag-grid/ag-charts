import type { _ModuleSupport } from 'ag-charts-community';

import { RadiusCategoryAxis } from './radiusCategoryAxis';

export const RadiusCategoryAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-category',
    instanceConstructor: RadiusCategoryAxis,
};
