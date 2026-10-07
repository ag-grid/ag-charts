import { type AgRadiusNumberAxisOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedRadiusNumberAxisOptions,
    commonAxisThemeTemplate,
    mergeDefaults,
    polarAxisThemeOptionsDefs,
    radiusCrossLineLabelOptionsDefs,
    titleAxisThemeTemplate,
} from 'ag-charts-core';

import { RadiusNumberAxis } from './radiusNumberAxis';
import { radiusNumberAxisOptionsDefs } from './radiusNumberAxisOptionsDefs';

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions, RadiusNumberAxis> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: radiusNumberAxisOptionsDefs,

    themeOptions: /* #__PURE__ */ polarAxisThemeOptionsDefs(
        radiusNumberAxisOptionsDefs,
        radiusCrossLineLabelOptionsDefs
    ),
    themeTemplate: mergeDefaults(
        {
            positionAngle: 0,
            line: { enabled: false },
            shape: { $findFirstSiblingNotOperation: ['polygon'] },
            label: { minSpacing: 5 },
            title: { spacing: 10 },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new RadiusNumberAxis(ctx, id, options as NormalisedRadiusNumberAxisOptions),
};
