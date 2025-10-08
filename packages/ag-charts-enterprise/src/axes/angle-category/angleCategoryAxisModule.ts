import { type AgAngleCategoryAxisOptions, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { AngleCategoryAxis } from './angleCategoryAxis';

export const AngleCategoryAxisModule: AxisModuleDefinition<AgAngleCategoryAxisOptions> = {
    type: 'axis',
    name: 'angle-category',
    chartType: 'polar',
    enterprise: true,

    options: _ModuleSupport.angleCategoryAxisOptionsDefs,

    create: (ctx) => new AngleCategoryAxis(ctx),
};
