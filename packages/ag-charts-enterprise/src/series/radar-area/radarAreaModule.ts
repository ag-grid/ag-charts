import { type AgRadarAreaSeriesOptions, PolarChartModule, VERSION } from 'ag-charts-community';
import { ChartAxisDirection, POLAR_AXIS_TYPE, type SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_AREA_SERIES_THEME } from '../radar/radarThemes';
import { RadarAreaSeries } from './radarAreaSeries';
import { radarAreaSeriesOptionsDef } from './radarAreaSeriesOptionsDef';

export const RadarAreaSeriesModule: SeriesModuleDefinition<AgRadarAreaSeriesOptions> = {
    type: 'series',
    name: 'radar-area',
    chartType: 'polar',
    enterprise: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: radarAreaSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    axisKeys: { [ChartAxisDirection.Angle]: 'angleKeyAxis', [ChartAxisDirection.Radius]: 'radiusKeyAxis' },
    themeTemplate: RADAR_AREA_SERIES_THEME,

    create: (ctx) => new RadarAreaSeries(ctx),
};
