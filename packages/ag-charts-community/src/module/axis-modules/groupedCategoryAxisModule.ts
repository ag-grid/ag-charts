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
    themeTemplate: {
        tick: { enabled: true, stroke: { $ref: 'separationLinesColor' } },
        label: { spacing: 10, rotation: 270, wrapping: 'on-space' },
        maxThicknessRatio: 0.5,
        paddingInner: 0.4,
        groupPaddingInner: 0.2,
    },

    create: (ctx) => new GroupedCategoryAxis(ctx),
};
