import type { _ModuleSupport } from 'ag-charts-community';

import { AngleNumberAxis } from './angleNumberAxis';

export const AngleNumberAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'angle-number',
    instanceConstructor: AngleNumberAxis,
};
