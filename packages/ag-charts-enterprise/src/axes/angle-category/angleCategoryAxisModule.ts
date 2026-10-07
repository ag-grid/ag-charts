import { type AgAngleCategoryAxisOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedAngleCategoryAxisOptions,
    commonAxisThemeTemplate,
    commonCrossLineLabelOptionsDefs,
    mergeDefaults,
    polarAxisThemeOptionsDefs,
} from 'ag-charts-core';

import { AngleCategoryAxis } from './angleCategoryAxis';
import { angleCategoryAxisOptionsDefs } from './angleCategoryAxisOptionsDefs';

export const AngleCategoryAxisModule: AxisModuleDefinition<AgAngleCategoryAxisOptions, AngleCategoryAxis> = {
    type: 'axis',
    name: 'angle-category',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: angleCategoryAxisOptionsDefs,

    themeOptions: /* #__PURE__ */ polarAxisThemeOptionsDefs(
        angleCategoryAxisOptionsDefs,
        commonCrossLineLabelOptionsDefs
    ),
    themeTemplate: mergeDefaults(
        {
            startAngle: 0,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: { spacing: 5 },
            gridLine: { enabled: false },
            shape: { $findFirstSiblingNotOperation: ['polygon'] },
        },
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new AngleCategoryAxis(ctx, id, options as NormalisedAngleCategoryAxisOptions),
};
