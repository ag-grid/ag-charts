import { type AgRadiusCategoryAxisOptions, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { RadiusCategoryAxis } from './radiusCategoryAxis';

export const RadiusCategoryAxisModule: AxisModuleDefinition<AgRadiusCategoryAxisOptions> = {
    type: 'axis',
    name: 'radius-category',
    chartType: 'polar',
    enterprise: true,

    options: _ModuleSupport.radiusCategoryAxisOptionsDefs,

    create: (ctx) => new RadiusCategoryAxis(ctx),
};
