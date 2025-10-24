import { type AgAngleNumberAxisOptions, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { AngleNumberAxis } from './angleNumberAxis';

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,

    options: _ModuleSupport.angleNumberAxisOptionsDefs,

    create: (ctx) => new AngleNumberAxis(ctx),
};
