import { type AgRadarLineSeriesOptions, PolarChartModule, VERSION } from 'ag-charts-community';
import { ChartAxisDirection, POLAR_AXIS_TYPE, type SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_LINE_SERIES_THEME } from '../radar/radarThemes';
import { RadarLineSeries } from './radarLineSeries';
import { radarLineSeriesOptionsDef } from './radarLineSeriesOptionsDef';

export const RadarLineSeriesModule: SeriesModuleDefinition<AgRadarLineSeriesOptions> = {
    type: 'series',
    name: 'radar-line',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: radarLineSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    axisKeys: { [ChartAxisDirection.Angle]: 'angleKeyAxis', [ChartAxisDirection.Radius]: 'radiusKeyAxis' },
    themeTemplate: RADAR_LINE_SERIES_THEME,

    create: (ctx) => new RadarLineSeries(ctx),
};
