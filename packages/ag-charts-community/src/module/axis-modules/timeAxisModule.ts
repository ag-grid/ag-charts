import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedTimeAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';
import type { AgTimeAxisOptions } from 'ag-charts-types';

import { timeAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { TimeAxis } from '../../chart/axis/timeAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import {
    commonAxisThemeTemplate,
    parentLevelAxisThemeTemplate,
    titleAxisThemeTemplate,
} from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions, TimeAxis> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: timeAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            gridLine: { enabled: false },
        },
        titleAxisThemeTemplate,
        parentLevelAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
        new TimeAxis(ctx, id, options as NormalisedTimeAxisOptions),
};
