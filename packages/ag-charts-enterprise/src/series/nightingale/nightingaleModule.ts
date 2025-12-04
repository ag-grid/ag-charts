import { type AgNightingaleSeriesOptions, PolarChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection, POLAR_AXIS_TYPE, type SeriesModuleDefinition } from 'ag-charts-core';

import { NightingaleSeries } from './nightingaleSeries';
import { nightingaleSeriesOptionsDef } from './nightingaleSeriesOptionsDef';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';

export const NightingaleSeriesModule: SeriesModuleDefinition<AgNightingaleSeriesOptions> = {
    type: 'series',
    name: 'nightingale',
    chartType: 'polar',
    enterprise: true,
    stackable: true,
    groupable: true,
    stackedByDefault: true,
    version: VERSION,
    dependencies: [PolarChartModule],

    options: nightingaleSeriesOptionsDef,
    defaultAxes: { angle: { type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, radius: { type: POLAR_AXIS_TYPE.RADIUS_NUMBER } },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate: NIGHTINGALE_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new NightingaleSeries(ctx),
};
