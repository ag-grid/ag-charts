import { type AgOrdinalTimeAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type AxisModuleDefinition, type DynamicContext, mergeDefaults } from 'ag-charts-core';

import { OrdinalTimeAxis } from './ordinalTimeAxis';

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.ordinalTimeAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0,
            label: { autoRotate: false, minSpacing: 40 },
            gridLine: { enabled: false },
            interval: { placement: 'between' },
        },
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new OrdinalTimeAxis(ctx, id, options as any),
};
