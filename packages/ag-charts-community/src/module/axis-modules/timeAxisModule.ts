import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgTimeAxisOptions } from 'ag-charts-types';

import { timeAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { TimeAxis } from '../../chart/axis/timeAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: timeAxisOptionsDefs,
    themeTemplate: {
        gridLine: { enabled: false },
    },

    create: (ctx) => new TimeAxis(ctx),
};
