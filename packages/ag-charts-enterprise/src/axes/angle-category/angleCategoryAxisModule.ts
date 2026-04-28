import { type AgAngleCategoryAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type AxisModuleDefinition, type DynamicContext, mergeDefaults } from 'ag-charts-core';

import { AngleCategoryAxis } from './angleCategoryAxis';

export const AngleCategoryAxisModule: AxisModuleDefinition<AgAngleCategoryAxisOptions> = {
    type: 'axis',
    name: 'angle-category',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.angleCategoryAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            label: { spacing: 5 },
            gridLine: { enabled: false },
            shape: { $findFirstSiblingNotOperation: undefined },
        },
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new AngleCategoryAxis(ctx, id, options as any),
};
