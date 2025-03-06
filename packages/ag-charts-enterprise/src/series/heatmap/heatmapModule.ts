import { type AgHeatmapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { HeatmapSeries } from './heatmapSeries';
import { heatmapSeriesOptionsDef } from './heatmapSeriesOptionsDef';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const HeatmapModule: _ModuleSupport.SeriesModule<'heatmap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'heatmap',
    moduleFactory: (ctx) => new HeatmapSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate: HEATMAP_SERIES_THEME,
};

export const HeatmapSeriesModule: SeriesModuleDefinition<AgHeatmapSeriesOptions> = {
    type: 'series',
    name: 'heatmap',
    chartType: 'cartesian',
    enterprise: true,

    options: heatmapSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new HeatmapSeries(ctx),
};
