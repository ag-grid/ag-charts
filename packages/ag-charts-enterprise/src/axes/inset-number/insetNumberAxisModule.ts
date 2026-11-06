import { type AgInsetNumberAxisOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedInsetNumberAxisOptions,
    type WithoutCrossLineOptions,
    cartesianAxisThemeOptionsDefs,
    commonAxisThemeTemplate,
    mergeDefaults,
    titleAxisThemeTemplate,
    without,
} from 'ag-charts-core';

import { AxisInteractionModule } from '../../features/axis-interaction/axisInteractionModule';
import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';
import { InsetNumberAxis } from './insetNumberAxis';
import { insetNumberAxisOptionsDefs } from './insetNumberAxisOptionsDefs';

export const InsetNumberAxisModule: AxisModuleDefinition<
    WithoutCrossLineOptions<AgInsetNumberAxisOptions>,
    InsetNumberAxis
> = {
    type: 'axis',
    name: 'inset-number',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule, AxisInteractionModule, BackgroundRegionsModule],

    options: insetNumberAxisOptionsDefs,

    themeOptions: /* #__PURE__ */ cartesianAxisThemeOptionsDefs(
        /* #__PURE__ */ without(insetNumberAxisOptionsDefs, ['lengthRatio'])
    ),
    themeTemplate: mergeDefaults(
        {
            nice: false,
            maxThicknessRatio: 0.3,
            spacing: 15,
            label: { enabled: false },
            line: { enabled: false },
            gridLine: { enabled: false },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new InsetNumberAxis(ctx, id, options as NormalisedInsetNumberAxisOptions),
};
