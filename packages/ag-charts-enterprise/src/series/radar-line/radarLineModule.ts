import { type AgRadarLineSeriesOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_LINE_SERIES_THEME } from '../radar/radarThemes';
import { RadarLineSeries } from './radarLineSeries';
import { radarLineSeriesOptionsDef } from './radarLineSeriesOptionsDef';

const {
    ChartAxisDirection,
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

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
    axisValueKeys: { [ChartAxisDirection.Angle]: 'angleKey', [ChartAxisDirection.Radius]: 'radiusKey' },
    themeTemplate: RADAR_LINE_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadarLineSeries(ctx),
};
