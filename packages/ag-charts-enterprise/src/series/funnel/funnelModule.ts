import { type AgFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { FunnelSeries } from './funnelSeries';
import { funnelSeriesOptionsDef } from './funnelSeriesOptionsDef';
import { FUNNEL_SERIES_AXES, FUNNEL_SERIES_THEME } from './funnelThemes';

export const FunnelModule: _ModuleSupport.SeriesModule<'funnel'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'funnel',
    moduleFactory: (ctx) => new FunnelSeries(ctx),
    solo: true,
    defaultAxes: FUNNEL_SERIES_AXES,
    themeTemplate: FUNNEL_SERIES_THEME,
};

export const FunnelSeriesModule: SeriesModuleDefinition<AgFunnelSeriesOptions> = {
    type: 'series',
    name: 'funnel',
    chartType: 'cartesian',
    enterprise: true,

    options: funnelSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new FunnelSeries(ctx),
};
