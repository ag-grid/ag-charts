import { type AgBoxPlotSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection, DIRECTION_SWAP_AXES, type SeriesModuleDefinition } from 'ag-charts-core';

import { BoxPlotSeries } from './boxPlotSeries';
import { boxPlotSeriesOptionsDef } from './boxPlotSeriesOptionsDef';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

const { predictCartesianNonPrimitiveAxis } = _ModuleSupport;

export const BoxPlotSeriesModule: SeriesModuleDefinition<AgBoxPlotSeriesOptions> = {
    type: 'series',
    name: 'box-plot',
    chartType: 'cartesian',
    enterprise: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: boxPlotSeriesOptionsDef,
    matchingKeys: ['xKey', 'lowKey', 'q1Key', 'medianKey', 'q3Key', 'highKey', 'outlierKey', 'normalizedTo'],
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisKeysFlipped: { [ChartAxisDirection.X]: 'yKeyAxis', [ChartAxisDirection.Y]: 'xKeyAxis' },
    themeTemplate: BOX_PLOT_SERIES_THEME,

    create: (ctx) => new BoxPlotSeries(ctx),
};
