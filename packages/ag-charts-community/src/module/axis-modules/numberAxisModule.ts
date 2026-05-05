import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedNumberAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';
import type { AgNumberAxisOptions } from 'ag-charts-types';

import { numberAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { NumberAxis } from '../../chart/axis/numberAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { commonAxisThemeTemplate, titleAxisThemeTemplate } from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const NumberAxisModule: AxisModuleDefinition<AgNumberAxisOptions, NumberAxis> = {
    type: 'axis',
    name: 'number',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: numberAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            maxThicknessRatio: 0.3,
            line: { enabled: false },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
        new NumberAxis(ctx, id, undefined, options as NormalisedNumberAxisOptions),
};
