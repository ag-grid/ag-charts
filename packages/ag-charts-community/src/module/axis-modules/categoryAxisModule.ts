import { type AxisModuleDefinition, type DynamicContext, mergeDefaults } from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import { categoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { CategoryAxis } from '../../chart/axis/categoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { commonAxisThemeTemplate, titleAxisThemeTemplate } from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions> = {
    type: 'axis',
    name: 'category',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: categoryAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0.1,
            label: { autoRotate: true, wrapping: 'on-space' },
            gridLine: { enabled: false },
            interval: { placement: 'between' },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) => new CategoryAxis(ctx, id, options as any),
};
