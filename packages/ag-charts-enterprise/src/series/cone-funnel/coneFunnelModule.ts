import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { funnelSeriesAxes } from '../funnel/funnelThemes';
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
    defaultAxes: funnelSeriesAxes,
    themeTemplate: CONE_FUNNEL_SERIES_THEME,

    paletteFactory: ({ userPalette, themeTemplateParameters, takeColors, colorsCount }) => {
        const { fills: userFills } = takeColors(colorsCount);
        const defaultFills = themeTemplateParameters.get(_Theme.DEFAULT_FUNNEL_SERIES_COLOR_RANGE) as string[];
        const fills = userPalette === 'inbuilt' ? defaultFills : [userFills[0], userFills[1]];
        return { fills, strokes: fills.slice(0) };
    },
};
