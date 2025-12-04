import { type AgHeatmapSeriesOptions, CartesianChartModule, VERSION } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION, ChartAxisDirection } from 'ag-charts-core';

import { HeatmapSeries } from './heatmapSeries';
import { heatmapSeriesOptionsDef } from './heatmapSeriesOptionsDef';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

export const HeatmapSeriesModule: SeriesModuleDefinition<AgHeatmapSeriesOptions> = {
    type: 'series',
    name: 'heatmap',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: heatmapSeriesOptionsDef,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate: HEATMAP_SERIES_THEME,

    create: (ctx) => new HeatmapSeries(ctx),
};
