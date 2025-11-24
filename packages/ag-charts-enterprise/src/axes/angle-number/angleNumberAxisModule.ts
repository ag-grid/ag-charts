import { type AgAngleNumberAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

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
    },

    create: (ctx) => new AngleNumberAxis(ctx),
};
