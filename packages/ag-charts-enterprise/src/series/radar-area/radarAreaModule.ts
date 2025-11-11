import { type AgRadarAreaSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_AREA_SERIES_THEME } from '../radar/radarThemes';
import { RadarAreaSeries } from './radarAreaSeries';
import { radarAreaSeriesOptionsDef } from './radarAreaSeriesOptionsDef';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadarAreaSeriesModule: SeriesModuleDefinition<AgRadarAreaSeriesOptions> = {
    type: 'series',
    name: 'radar-area',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: radarAreaSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    themeTemplate: RADAR_AREA_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadarAreaSeries(ctx),
};
