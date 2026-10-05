import {
    type AxisModuleDefinition,
    type DynamicContext,
    type NormalisedUnitTimeAxisOptions,
    commonAxisThemeTemplate,
    mergeDefaults,
    parentLevelAxisThemeTemplate,
    titleAxisThemeTemplate,
    unitTimeAxisOptionsDefs,
} from 'ag-charts-core';
import type { AgUnitTimeAxisOptions } from 'ag-charts-types';

import { UnitTimeAxis } from '../../chart/axis/unitTimeAxis';
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';
import type { ChartRegistry } from '../moduleContext';
import { communityModule } from '../moduleIdentity';

export const UnitTimeAxisModule: AxisModuleDefinition<AgUnitTimeAxisOptions, UnitTimeAxis> =
    /* #__PURE__ */ communityModule({
        type: 'axis',
        name: 'unit-time',
        chartType: 'cartesian',
        version: VERSION,
        dependencies: [CartesianChartModule],

        options: unitTimeAxisOptionsDefs,
        themeTemplate: mergeDefaults(
            {
                groupPaddingInner: 0.1,
                maxThicknessRatio: 0.3,
                label: { autoRotate: false },
                gridLine: { enabled: false },
                parentLevel: { enabled: true },
                interval: { placement: 'between' },
            },
            titleAxisThemeTemplate,
            parentLevelAxisThemeTemplate,
            commonAxisThemeTemplate
        ),

        create: (ctx: DynamicContext<ChartRegistry>, id, options) =>
            new UnitTimeAxis(ctx, id, options as NormalisedUnitTimeAxisOptions),
    });
