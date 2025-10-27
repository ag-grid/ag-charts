import { type AgRadialColumnSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RadialColumnSeries } from './radialColumnSeries';
import { radialColumnSeriesOptionsDef } from './radialColumnSeriesOptionsDef';
import { RADIAL_COLUMN_SERIES_THEME } from './radialColumnThemes';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadialColumnSeriesModule: SeriesModuleDefinition<AgRadialColumnSeriesOptions> = {
    type: 'series',
    name: 'radial-column',
    chartType: 'polar',
    enterprise: true,
    stackable: true,
    groupable: true,
    version: VERSION,

    options: radialColumnSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    themeTemplate: RADIAL_COLUMN_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadialColumnSeries(ctx),
};
