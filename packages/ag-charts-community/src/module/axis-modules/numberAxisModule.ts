import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgNumberAxisOptions } from 'ag-charts-types';

import { numberAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { NumberAxis } from '../../chart/axis/numberAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const NumberAxisModule: AxisModuleDefinition<AgNumberAxisOptions> = {
    type: 'axis',
    name: 'number',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: numberAxisOptionsDefs,
    themeTemplate: {
        line: { enabled: false },
    },

    create: (ctx) => new NumberAxis(ctx),
};
