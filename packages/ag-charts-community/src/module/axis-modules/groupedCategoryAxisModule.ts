import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgGroupedCategoryAxisOptions } from 'ag-charts-types';

import { groupedCategoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { GroupedCategoryAxis } from '../../chart/axis/groupedCategoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const GroupedCategoryAxisModule: AxisModuleDefinition<AgGroupedCategoryAxisOptions> = {
    type: 'axis',
    name: 'grouped-category',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: groupedCategoryAxisOptionsDefs,

    create: (ctx) => new GroupedCategoryAxis(ctx),
};
