import { type AgBoxPlotSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { BoxPlotSeries } from './boxPlotSeries';
import { boxPlotSeriesOptionsDef } from './boxPlotSeriesOptionsDef';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

const { DIRECTION_SWAP_AXES, ChartAxisDirection, predictCartesianNonPrimitiveAxis } = _ModuleSupport;

export const BoxPlotSeriesModule: SeriesModuleDefinition<AgBoxPlotSeriesOptions> = {
    type: 'series',
    name: 'box-plot',
    chartType: 'cartesian',
    enterprise: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: boxPlotSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisValueKeys: {
        [ChartAxisDirection.X]: 'xKey',
        [ChartAxisDirection.Y]: ['minKey', 'q1Key', 'medianKey', 'q3Key', 'maxKey'],
    },
    themeTemplate: BOX_PLOT_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new BoxPlotSeries(ctx),
};
