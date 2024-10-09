import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { PyramidSeries } from './pyramidSeries';
import { PYRAMID_SERIES_THEME } from './pyramidThemes';

export const PyramidModule: _ModuleSupport.SeriesModule<'pyramid'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],

    identifier: 'pyramid',
    moduleFactory: (ctx) => new PyramidSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: PYRAMID_SERIES_THEME,

    paletteFactory: ({ takeColors, colorsCount }) => {
        const { fills, strokes } = takeColors(colorsCount);
        return { fills, strokes };
    },
};
