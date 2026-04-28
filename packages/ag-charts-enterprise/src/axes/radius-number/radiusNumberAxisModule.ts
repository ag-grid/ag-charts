import { type AgRadiusNumberAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type AxisModuleDefinition, type DynamicContext, mergeDefaults } from 'ag-charts-core';

import { RadiusNumberAxis } from './radiusNumberAxis';

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.radiusNumberAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            positionAngle: 0,
            line: { enabled: false },
            shape: { $findFirstSiblingNotOperation: undefined },
            label: { minSpacing: 5 },
        },
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new RadiusNumberAxis(ctx, id, options as any),
};
