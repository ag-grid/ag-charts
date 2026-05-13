import { type AgRadiusNumberAxisOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedRadiusNumberAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';

import { CrossLinesModule } from '../polar-crosslines/crossLinesModule';
import { RadiusNumberAxis } from './radiusNumberAxis';

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions, RadiusNumberAxis> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule, CrossLinesModule],

    options: _ModuleSupport.radiusNumberAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            positionAngle: 0,
            line: { enabled: false },
            shape: { $findFirstSiblingNotOperation: ['polygon'] },
            label: { minSpacing: 5 },
            title: { spacing: 10 },
        },
        _ModuleSupport.titleAxisThemeTemplate,
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new RadiusNumberAxis(ctx, id, options as NormalisedRadiusNumberAxisOptions),
};
