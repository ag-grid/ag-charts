import { type AgRadialBarSeriesOptions, PolarChartModule, VERSION } from 'ag-charts-community';
import { ChartAxisDirection, POLAR_AXIS_TYPE, type SeriesModuleDefinition } from 'ag-charts-core';

import { RadialBarSeries } from './radialBarSeries';
import { radialBarSeriesOptionsDef } from './radialBarSeriesOptionsDef';
import { RADIAL_BAR_SERIES_THEME } from './radialBarThemes';

export const RadialBarSeriesModule: SeriesModuleDefinition<AgRadialBarSeriesOptions> = {
    type: 'series',
    name: 'radial-bar',
    chartType: 'polar',
    enterprise: true,
    stackable: true,
    groupable: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: radialBarSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_NUMBER }, radius: { type: POLAR_AXIS_TYPE.RADIUS_CATEGORY } },
    axisKeys: { [ChartAxisDirection.Angle]: 'angleKeyAxis', [ChartAxisDirection.Radius]: 'radiusKeyAxis' },
    themeTemplate: RADIAL_BAR_SERIES_THEME,

    create: (ctx) => new RadialBarSeries(ctx),
};
