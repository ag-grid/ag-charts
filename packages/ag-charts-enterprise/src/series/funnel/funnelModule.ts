import { type AgFunnelSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { FunnelSeries } from './funnelSeries';
import { funnelSeriesOptionsDef } from './funnelSeriesOptionsDef';
import { FUNNEL_SERIES_AXES, FUNNEL_SERIES_THEME } from './funnelThemes';

const { ChartAxisDirection } = _ModuleSupport;

export const FunnelSeriesModule: SeriesModuleDefinition<AgFunnelSeriesOptions> = {
    type: 'series',
    name: 'funnel',
    chartType: 'cartesian',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: funnelSeriesOptionsDef,
    defaultAxes: FUNNEL_SERIES_AXES,
    axisValueKeys: { [ChartAxisDirection.X]: 'valueKey', [ChartAxisDirection.Y]: 'stageKey' },
    themeTemplate: FUNNEL_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new FunnelSeries(ctx),
};
