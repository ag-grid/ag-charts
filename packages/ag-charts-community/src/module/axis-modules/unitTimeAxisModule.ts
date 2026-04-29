import { type AxisModuleDefinition, type DynamicContext, mergeDefaults } from 'ag-charts-core';
import type { AgUnitTimeAxisOptions } from 'ag-charts-types';

import { unitTimeAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { UnitTimeAxis } from '../../chart/axis/unitTimeAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import {
    commonAxisThemeTemplate,
    parentLevelAxisThemeTemplate,
    titleAxisThemeTemplate,
} from '../../chart/themes/axisThemeTemplate';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';

export const UnitTimeAxisModule: AxisModuleDefinition<AgUnitTimeAxisOptions> = {
    type: 'axis',
    name: 'unit-time',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: unitTimeAxisOptionsDefs,
    themeTemplate: mergeDefaults(
        {
            groupPaddingInner: 0.1,
            label: { autoRotate: false },
            gridLine: { enabled: false },
            parentLevel: { enabled: true },
            interval: { placement: 'between' },
        },
        titleAxisThemeTemplate,
        parentLevelAxisThemeTemplate,
        commonAxisThemeTemplate
    ),

    create: (ctx: DynamicContext<ChartRegistry>, id, options) => new UnitTimeAxis(ctx, id, options as any),
};
