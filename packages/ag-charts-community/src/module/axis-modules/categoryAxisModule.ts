import { type AxisModuleDefinition, type DynamicContext } from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import { categoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { CategoryAxis } from '../../chart/axis/categoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

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
        interval: { placement: 'between' },
    },

    create: (ctx: DynamicContext<ChartRegistry>, id, options) => new CategoryAxis(ctx, id, options as any),
};
