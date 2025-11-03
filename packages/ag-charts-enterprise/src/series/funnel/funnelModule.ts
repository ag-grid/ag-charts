import { type AgFunnelSeriesOptions, VERSION, type _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { FunnelSeries } from './funnelSeries';
import { funnelSeriesOptionsDef } from './funnelSeriesOptionsDef';
import { FUNNEL_SERIES_AXES, FUNNEL_SERIES_THEME } from './funnelThemes';

export const FunnelSeriesModule: SeriesModuleDefinition<AgFunnelSeriesOptions> = {
    type: 'series',
    name: 'funnel',
    chartType: 'cartesian',
    enterprise: true,
    solo: true,
    version: VERSION,

    options: funnelSeriesOptionsDef,
    defaultAxes: FUNNEL_SERIES_AXES,
    themeTemplate: FUNNEL_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new FunnelSeries(ctx),
};
