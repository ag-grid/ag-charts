import { type AgBoxPlotSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { BoxPlotSeries } from './boxPlotSeries';
import { boxPlotSeriesOptionsDef } from './boxPlotSeriesOptionsDef';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

const {
    swapAxisCondition,
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const BoxPlotModule: _ModuleSupport.SeriesModule<'box-plot'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'box-plot',
    moduleFactory: (ctx) => new BoxPlotSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: swapAxisCondition(
        [
            { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
            { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,
};

export const BoxPlotSeriesModule: SeriesModuleDefinition<AgBoxPlotSeriesOptions> = {
    type: 'series',
    name: 'box-plot',
    chartType: 'cartesian',
    enterprise: true,

    options: boxPlotSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new BoxPlotSeries(ctx),
};
