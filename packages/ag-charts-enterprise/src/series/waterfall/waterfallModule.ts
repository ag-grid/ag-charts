import type { AgWaterfallSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { WaterfallSeries } from './waterfallSeries';
import { WATERFALL_DEFAULTS } from './waterfallDefaults';
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
    paletteFactory: ({ takeColors, colorsCount }) => {
        const { fills, strokes } = takeColors(colorsCount);
        return {
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
        };
    },
};
