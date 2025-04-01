import { type AgRadarLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_LINE_SERIES_THEME } from '../radar/radarThemes';
import { RadarLineSeries } from './radarLineSeries';
import { radarLineSeriesOptionsDef } from './radarLineSeriesOptionsDef';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadarLineModule: _ModuleSupport.SeriesModule<'radar-line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radar-line',
    moduleFactory: (ctx) => new RadarLineSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: RADAR_LINE_SERIES_THEME,
};

export const RadarLineSeriesModule: SeriesModuleDefinition<AgRadarLineSeriesOptions<never>> = {
    type: 'series',
    name: 'radar-line',
    chartType: 'polar',
    enterprise: true,

    options: radarLineSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadarLineSeries(ctx),
};
