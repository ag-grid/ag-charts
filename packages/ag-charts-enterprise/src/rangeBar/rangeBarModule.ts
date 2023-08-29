import type { AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RangeBarSeries } from './rangeBar';
import { RANGE_BAR_DEFAULTS } from './rangeBarDefaults';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeBarModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    instanceConstructor: RangeBarSeries,
    seriesDefaults: RANGE_BAR_DEFAULTS,
    themeTemplate: RANGE_BAR_SERIES_THEME,

    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },

    groupable: true,

    swapDefaultAxesCondition: (opts) => (opts.series?.[0] as AgRangeBarSeriesOptions)?.direction !== 'horizontal',
};
