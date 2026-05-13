import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedNumberAxisOptions,
    mergeDefaults,
} from 'ag-charts-core';
import type { AgLogAxisOptions } from 'ag-charts-types';

import { logAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { LogAxis } from '../../chart/axis/logAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { CrossLinesModule } from '../../chart/crossline/crossLinesModule';
import { commonAxisThemeTemplate, titleAxisThemeTemplate } from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const LogAxisModule: AxisModuleDefinition<AgLogAxisOptions, LogAxis> = {
    type: 'axis',
    name: 'log',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule, CrossLinesModule],

    options: logAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            base: 10,
            maxThicknessRatio: 0.3,
            line: { enabled: false },
        },
        titleAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
        new LogAxis(ctx, id, options as NormalisedNumberAxisOptions),
};
