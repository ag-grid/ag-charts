import { type AgAngleNumberAxisOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedAngleNumberAxisOptions,
    angleNumberAxisOptionsDefs,
    commonAxisThemeTemplate,
    mergeDefaults,
} from 'ag-charts-core';

import { AngleNumberAxis } from './angleNumberAxis';

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions, AngleNumberAxis> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: angleNumberAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            startAngle: 0,
            shape: 'circle',
            label: { spacing: 5 },
            gridLine: { enabled: false },
        },
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new AngleNumberAxis(ctx, id, options as NormalisedAngleNumberAxisOptions),
};
