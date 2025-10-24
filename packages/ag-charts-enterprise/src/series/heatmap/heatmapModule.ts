import { type AgHeatmapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { HeatmapSeries } from './heatmapSeries';
import { heatmapSeriesOptionsDef } from './heatmapSeriesOptionsDef';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;

export const HeatmapSeriesModule: SeriesModuleDefinition<AgHeatmapSeriesOptions> = {
    type: 'series',
    name: 'heatmap',
    chartType: 'cartesian',
    enterprise: true,

    options: heatmapSeriesOptionsDef,
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate: HEATMAP_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new HeatmapSeries(ctx),
};
