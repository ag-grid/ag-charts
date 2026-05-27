import { type AgOrdinalTimeAxisOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedOrdinalTimeAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';

import { OrdinalTimeAxis } from './ordinalTimeAxis';

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions, OrdinalTimeAxis> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: _ModuleSupport.ordinalTimeAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0,
            maxThicknessRatio: 0.3,
            label: { autoRotate: false, minSpacing: 40 },
            gridLine: { enabled: false },
            interval: { placement: 'between' },
        },
        _ModuleSupport.titleAxisThemeTemplate,
        _ModuleSupport.parentLevelAxisThemeTemplate,
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new OrdinalTimeAxis(ctx, id, options as NormalisedOrdinalTimeAxisOptions),
};
