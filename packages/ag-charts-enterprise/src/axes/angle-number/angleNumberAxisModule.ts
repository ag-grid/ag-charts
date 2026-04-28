import { type AgAngleNumberAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition, DynamicContext } from 'ag-charts-core';

import { AngleNumberAxis } from './angleNumberAxis';

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.angleNumberAxisOptionsDefs,
    themeTemplate: {
        label: { spacing: 5 },
        gridLine: { enabled: false },
    },

    create: (ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id, options) =>
        new AngleNumberAxis(ctx, id, options as any),
};
