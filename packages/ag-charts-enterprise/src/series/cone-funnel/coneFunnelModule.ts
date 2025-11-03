import { type AgConeFunnelSeriesOptions, VERSION, type _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { FUNNEL_SERIES_AXES } from '../funnel/funnelThemes';
import { ConeFunnelSeries } from './coneFunnelSeries';
import { coneFunnelSeriesOptionsDef } from './coneFunnelSeriesOptionsDef';
import { CONE_FUNNEL_SERIES_THEME } from './coneFunnelThemes';

export const ConeFunnelSeriesModule: SeriesModuleDefinition<AgConeFunnelSeriesOptions> = {
    type: 'series',
    name: 'cone-funnel',
    chartType: 'cartesian',
    enterprise: true,
    solo: true,
    version: VERSION,

    options: coneFunnelSeriesOptionsDef,
    defaultAxes: FUNNEL_SERIES_AXES,
    themeTemplate: CONE_FUNNEL_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new ConeFunnelSeries(ctx),
};
