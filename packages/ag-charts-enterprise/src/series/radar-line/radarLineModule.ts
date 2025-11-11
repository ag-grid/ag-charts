import { type AgRadarLineSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_LINE_SERIES_THEME } from '../radar/radarThemes';
import { RadarLineSeries } from './radarLineSeries';
import { radarLineSeriesOptionsDef } from './radarLineSeriesOptionsDef';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadarLineSeriesModule: SeriesModuleDefinition<AgRadarLineSeriesOptions> = {
    type: 'series',
    name: 'radar-line',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,

    options: radarLineSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    themeTemplate: RADAR_LINE_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadarLineSeries(ctx),
};
