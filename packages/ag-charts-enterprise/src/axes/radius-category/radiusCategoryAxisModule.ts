import { type AgRadiusCategoryAxisOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedRadiusCategoryAxisOptions,
    commonAxisThemeTemplate,
    mergeDefaults,
    polarAxisThemeOptionsDefs,
    radiusCrossLineLabelOptionsDefs,
    titleAxisThemeTemplate,
} from 'ag-charts-core';

import { RadiusCategoryAxis } from './radiusCategoryAxis';
import { radiusCategoryAxisOptionsDefs } from './radiusCategoryAxisOptionsDefs';

export const RadiusCategoryAxisModule: AxisModuleDefinition<AgRadiusCategoryAxisOptions, RadiusCategoryAxis> = {
    type: 'axis',
    name: 'radius-category',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: radiusCategoryAxisOptionsDefs,

    themeOptions: /* #__PURE__ */ polarAxisThemeOptionsDefs(
        radiusCategoryAxisOptionsDefs,
        radiusCrossLineLabelOptionsDefs
    ),
    themeTemplate: mergeDefaults(
        {
            positionAngle: 0,
            groupPaddingInner: 0,
            paddingInner: 0,
            paddingOuter: 0,
            shape: 'circle',
            line: { enabled: false },
            label: { minSpacing: 5 },
            title: { spacing: 10 },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new RadiusCategoryAxis(ctx, id, options as NormalisedRadiusCategoryAxisOptions),
};
