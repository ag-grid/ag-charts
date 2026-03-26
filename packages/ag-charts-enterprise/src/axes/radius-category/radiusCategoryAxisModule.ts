import { type AgRadiusCategoryAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { RadiusCategoryAxis } from './radiusCategoryAxis';

export const RadiusCategoryAxisModule: AxisModuleDefinition<AgRadiusCategoryAxisOptions> = {
    type: 'axis',
    name: 'radius-category',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.radiusCategoryAxisOptionsDefs,
    themeTemplate: {
        positionAngle: 0,
        line: { enabled: false },
        label: { minSpacing: 5 },
    },

    create: (ctx) => new RadiusCategoryAxis(ctx),
};
