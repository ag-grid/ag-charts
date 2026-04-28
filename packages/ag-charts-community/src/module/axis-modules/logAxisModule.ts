import { type AxisModuleDefinition, type DynamicContext } from 'ag-charts-core';
import type { AgLogAxisOptions } from 'ag-charts-types';

import { logAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { LogAxis } from '../../chart/axis/logAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const LogAxisModule: AxisModuleDefinition<AgLogAxisOptions> = {
    type: 'axis',
    name: 'log',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: logAxisOptionsDefs,
    themeTemplate: {
        base: 10,
        line: { enabled: false },
    },

    create: (ctx: DynamicContext<ChartRegistry>, id, options) => new LogAxis(ctx, id, options as any),
};
