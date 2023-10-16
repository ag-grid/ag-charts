import type { AgWaterfallSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { _Scale, _Theme } from 'ag-charts-community';

import { WATERFALL_DEFAULTS } from './waterfallDefaults';
import { WaterfallSeries } from './waterfallSeries';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    instanceConstructor: WaterfallSeries,
    seriesDefaults: WATERFALL_DEFAULTS,
    themeTemplate: WATERFALL_SERIES_THEME,
    swapDefaultAxesCondition: (opts) => (opts.series?.[0] as AgWaterfallSeriesOptions)?.direction !== 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        return userPalette
            ? {
                  item: {
                      positive: {
                          fill: fills[0],
                          stroke: strokes[0],
                      },
                      negative: {
                          fill: fills[1],
                          stroke: strokes[1],
                      },
                      total: {
                          fill: fills[2],
                          stroke: strokes[2],
                      },
                  },
              }
            : {
                  item: {
                      positive: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
                      negative: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
                      total: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS),
                  },
              };
    },
};
