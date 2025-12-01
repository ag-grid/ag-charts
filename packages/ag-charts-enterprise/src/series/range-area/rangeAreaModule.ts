import { type AgRangeAreaSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeAreaSeries } from './rangeArea';
import { rangeAreaSeriesOptionsDef } from './rangeAreaSeriesOptionsDef';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const {
    ChartAxisDirection,
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
    predictCartesianNonPrimitiveAxis,
} = _ModuleSupport;

export const RangeAreaSeriesModule: SeriesModuleDefinition<AgRangeAreaSeriesOptions> = {
    type: 'series',
    name: 'range-area',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: rangeAreaSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate: RANGE_AREA_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RangeAreaSeries(ctx),
};
