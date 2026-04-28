import { type AgRadiusCategoryAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition, DynamicContext } from 'ag-charts-core';

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

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new RadiusCategoryAxis(ctx, id, options as any),
};
