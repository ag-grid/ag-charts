import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { FunnelSeries } from './funnelSeries';
import { FUNNEL_SERIES_THEME } from './funnelThemes';

export const FunnelModule: _ModuleSupport.SeriesModule<'funnel'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'funnel',
    moduleFactory: (ctx) => new FunnelSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.POSITION.BOTTOM,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
            position: _Theme.POSITION.LEFT,
        },
    ],
    swapDefaultAxesCondition: (series) => series?.direction !== 'vertical',
    themeTemplate: FUNNEL_SERIES_THEME,

    paletteFactory: ({ takeColors }) => {
        const { fills, strokes } = takeColors(1);
        return { fills, strokes };
    },
};
