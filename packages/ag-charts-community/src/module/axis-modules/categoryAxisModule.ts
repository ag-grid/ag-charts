import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedCategoryAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import { categoryAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { CategoryAxis } from '../../chart/axis/categoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { CrossLinesModule } from '../../chart/crossline/crossLinesModule';
import { commonAxisThemeTemplate, titleAxisThemeTemplate } from '../../chart/themes/axisThemeTemplate';
import { CategoryScale } from '../../scale/categoryScale';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions, CategoryAxis> = {
    type: 'axis',
    name: 'category',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule, CrossLinesModule],

    options: categoryAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0.1,
            maxThicknessRatio: 0.3,
            label: { autoRotate: true, wrapping: 'on-space' },
            gridLine: { enabled: false },
            interval: { placement: 'between' },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
        new CategoryAxis(ctx, id, new CategoryScale<string | object>(), options as NormalisedCategoryAxisOptions),
};
