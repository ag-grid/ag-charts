import { type AgBoxPlotSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { BoxPlotSeries } from './boxPlotSeries';
import { boxPlotSeriesOptionsDef } from './boxPlotSeriesOptionsDef';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

export const BoxPlotSeriesModule: SeriesModuleDefinition<AgBoxPlotSeriesOptions> = {
    type: 'series',
    name: 'box-plot',
    chartType: 'cartesian',
    enterprise: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: boxPlotSeriesOptionsDef,
    predictAxis: _ModuleSupport.predictCartesianNonPrimitiveAxis,
    defaultAxes: _ModuleSupport.DIRECTION_SWAP_AXES,
    themeTemplate: BOX_PLOT_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new BoxPlotSeries(ctx),
};
