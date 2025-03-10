import { type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RADAR_AREA_SERIES_THEME } from '../radar/radarThemes';
import { RadarAreaSeries } from './radarAreaSeries';
import { radarAreaSeriesOptionsDef } from './radarAreaSeriesOptionsDef';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const RadarAreaModule: _ModuleSupport.SeriesModule<'radar-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radar-area',
    moduleFactory: (ctx) => new RadarAreaSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: RADAR_AREA_SERIES_THEME,
};

export const RadarAreaSeriesModule: SeriesModuleDefinition<AgRadarAreaSeriesOptions> = {
    type: 'series',
    name: 'radar-area',
    chartType: 'polar',
    enterprise: true,

    options: radarAreaSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadarAreaSeries(ctx),
};
