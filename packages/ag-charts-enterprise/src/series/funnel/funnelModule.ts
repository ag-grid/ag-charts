import { type AgFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { FunnelSeries } from './funnelSeries';
import { funnelSeriesOptionsDef } from './funnelSeriesOptionsDef';
import { FUNNEL_SERIES_THEME, funnelSeriesAxes } from './funnelThemes';

export const FunnelModule: _ModuleSupport.SeriesModule<'funnel'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'funnel',
    moduleFactory: (ctx) => new FunnelSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: funnelSeriesAxes,
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
