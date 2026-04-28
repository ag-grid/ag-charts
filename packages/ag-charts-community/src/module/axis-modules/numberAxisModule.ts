import { type AxisModuleDefinition, type DynamicContext } from 'ag-charts-core';
import type { AgNumberAxisOptions } from 'ag-charts-types';

import { numberAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { NumberAxis } from '../../chart/axis/numberAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

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

    create: (ctx: DynamicContext<ChartRegistry>, id, options) => new NumberAxis(ctx, id, options as any),
};
