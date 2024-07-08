import type { _ModuleSupport } from 'ag-charts-community';

import { AngleCategoryAxis } from './angleCategoryAxis';

export const AngleCategoryAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'angle-category',
    instanceConstructor: AngleCategoryAxis,
};
