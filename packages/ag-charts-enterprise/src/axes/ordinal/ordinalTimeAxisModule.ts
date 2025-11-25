import { type AgOrdinalTimeAxisOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { OrdinalTimeAxis } from './ordinalTimeAxis';

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.ordinalTimeAxisOptionsDefs,
    themeTemplate: {
        groupPaddingInner: 0,
        label: { autoRotate: false },
        gridLine: { enabled: false },
    },

    create: (ctx) => new OrdinalTimeAxis(ctx),
};
