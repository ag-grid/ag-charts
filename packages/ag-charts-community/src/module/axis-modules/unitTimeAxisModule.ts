import { type AxisModuleDefinition } from 'ag-charts-core';
import type { AgUnitTimeAxisOptions } from 'ag-charts-types';

import { unitTimeAxisOptionsDefs } from '../../chart/axesOptionsDefs';
import { UnitTimeAxis } from '../../chart/axis/unitTimeAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const UnitTimeAxisModule: AxisModuleDefinition<AgUnitTimeAxisOptions> = {
    type: 'axis',
    name: 'unit-time',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: unitTimeAxisOptionsDefs,
    themeTemplate: {
        groupPaddingInner: 0.1,
        label: { autoRotate: false },
        gridLine: { enabled: false },
        parentLevel: { enabled: true },
    },

    create: (ctx) => new UnitTimeAxis(ctx),
};
