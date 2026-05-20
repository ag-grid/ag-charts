import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedGroupedCategoryAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';
import type { AgGroupedCategoryAxisOptions } from 'ag-charts-types';

import { groupedCategoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { GroupedCategoryAxis } from '../../chart/axis/groupedCategoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { commonAxisThemeTemplate, titleAxisThemeTemplate } from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const GroupedCategoryAxisModule: AxisModuleDefinition<AgGroupedCategoryAxisOptions, GroupedCategoryAxis> = {
    type: 'axis',
    name: 'grouped-category',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: groupedCategoryAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            tick: { enabled: true, stroke: { $ref: 'separationLinesColor' } },
            label: { spacing: 10, rotation: 270, wrapping: 'on-space' },
            maxThicknessRatio: 0.5,
            paddingInner: 0.4,
            groupPaddingInner: 0.2,
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
        new GroupedCategoryAxis(ctx, id, options as NormalisedGroupedCategoryAxisOptions),
};
