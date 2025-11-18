import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgLogAxisOptions } from 'ag-charts-types';

import { logAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { LogAxis } from '../../chart/axis/logAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const LogAxisModule: AxisModuleDefinition<AgLogAxisOptions> = {
    type: 'axis',
    name: 'log',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: logAxisOptionsDefs,

    create: (ctx) => new LogAxis(ctx),
};
