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
};
