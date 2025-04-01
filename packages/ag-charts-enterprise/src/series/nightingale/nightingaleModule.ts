import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { NightingaleSeries } from './nightingaleSeries';
import { nightingaleSeriesOptionsDef } from './nightingaleSeriesOptionsDef';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const NightingaleModule: _ModuleSupport.SeriesModule<'nightingale'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'nightingale',
    moduleFactory: (ctx) => new NightingaleSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: NIGHTINGALE_SERIES_THEME,
    stackable: true,
    groupable: true,
    stackedByDefault: true,
};

export const NightingaleSeriesModule: SeriesModuleDefinition<AgNightingaleSeriesOptions<never>> = {
    type: 'series',
    name: 'nightingale',
    chartType: 'polar',
    enterprise: true,

    options: nightingaleSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new NightingaleSeries(ctx),
};
