import type { _ModuleSupport } from 'ag-charts-community';

import { FunnelSeries } from './funnelSeries';
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

    paletteFactory: ({ takeColors }) => {
        const { fills, strokes } = takeColors(1);
        return { fills, strokes };
    },
};
