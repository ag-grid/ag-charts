import {
    type AxisModuleDefinition,
    CategoryScale,
    type DynamicContext,
    type NormalisedCategoryAxisOptions,
    cartesianAxisThemeOptionsDefs,
    categoryAxisOptionsDefs,
    commonAxisThemeTemplate,
    mergeDefaults,
    titleAxisThemeTemplate,
} from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import { CategoryAxis } from '../../chart/axis/categoryAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';
import { communityModule } from '../moduleIdentity';

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions, CategoryAxis> =
    /* #__PURE__ */ communityModule({
        type: 'axis',
        name: 'category',
        chartType: 'cartesian',
        version: VERSION,
        dependencies: [CartesianChartModule],

        options: categoryAxisOptionsDefs,

        themeOptions: /* #__PURE__ */ cartesianAxisThemeOptionsDefs(categoryAxisOptionsDefs),
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
    });
