import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { ConeFunnelSeries } from './coneFunnelSeries';
import { CONE_FUNNEL_SERIES_THEME } from './coneFunnelThemes';

export const ConeFunnelModule: _ModuleSupport.SeriesModule<'cone-funnel'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'cone-funnel',
    moduleFactory: (ctx) => new ConeFunnelSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'nearest' },
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
    themeTemplate: CONE_FUNNEL_SERIES_THEME,

    paletteFactory: ({ takeColors, colorsCount }) => {
        const { fills, strokes } = takeColors(colorsCount);
        return { fills, strokes };
    },
};
