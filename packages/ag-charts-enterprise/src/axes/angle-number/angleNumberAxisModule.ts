import { type AgAngleNumberAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedAngleNumberAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';

import { AngleNumberAxis } from './angleNumberAxis';

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions, AngleNumberAxis> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.angleNumberAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            label: { spacing: 5 },
            gridLine: { enabled: false },
        },
        _ModuleSupport.commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new AngleNumberAxis(ctx, id, options as NormalisedAngleNumberAxisOptions),
};
