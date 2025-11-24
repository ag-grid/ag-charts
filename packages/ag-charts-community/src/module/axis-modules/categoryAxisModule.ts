import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import { categoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { CategoryAxis } from '../../chart/axis/categoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions> = {
    type: 'axis',
    name: 'category',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: categoryAxisOptionsDefs,
    themeTemplate: {
        groupPaddingInner: 0.1,
        label: { autoRotate: true, wrapping: 'on-space' },
        gridLine: { enabled: false },
    },

    create: (ctx) => new CategoryAxis(ctx),
};
