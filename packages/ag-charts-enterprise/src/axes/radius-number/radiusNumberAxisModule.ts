import { type AgRadiusNumberAxisOptions, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { RadiusNumberAxis } from './radiusNumberAxis';

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,

    options: _ModuleSupport.radiusNumberAxisOptionsDefs,

    create: (ctx) => new RadiusNumberAxis(ctx),
};
