import { type AgRadialBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RadialBarSeries } from './radialBarSeries';
import { radialBarSeriesOptionsDef } from './radialBarSeriesOptionsDef';
import { RADIAL_BAR_SERIES_THEME } from './radialBarThemes';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadialBarSeriesModule: SeriesModuleDefinition<AgRadialBarSeriesOptions> = {
    type: 'series',
    name: 'radial-bar',
    chartType: 'polar',
    enterprise: true,
    stackable: true,
    groupable: true,

    options: radialBarSeriesOptionsDef,
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_NUMBER }, { type: POLAR_AXIS_TYPE.RADIUS_CATEGORY }],
    themeTemplate: RADIAL_BAR_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadialBarSeries(ctx),
};
