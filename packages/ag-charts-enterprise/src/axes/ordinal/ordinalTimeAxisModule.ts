import { type AgOrdinalTimeAxisOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedOrdinalTimeAxisOptions,
    commonAxisThemeTemplate,
    mergeDefaults,
    ordinalTimeAxisOptionsDefs,
    parentLevelAxisThemeTemplate,
    titleAxisThemeTemplate,
} from 'ag-charts-core';

import { AxisInteractionModule } from '../../features/axis-interaction/axisInteractionModule';
import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';
import { OrdinalTimeAxis } from './ordinalTimeAxis';

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions, OrdinalTimeAxis> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule, AxisInteractionModule, BackgroundRegionsModule],

    options: ordinalTimeAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0,
            maxThicknessRatio: 0.3,
            label: { autoRotate: false, minSpacing: 40 },
            gridLine: { enabled: false },
            interval: { placement: 'between' },
        },
        titleAxisThemeTemplate,
        parentLevelAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new OrdinalTimeAxis(ctx, id, options as NormalisedOrdinalTimeAxisOptions),
};
