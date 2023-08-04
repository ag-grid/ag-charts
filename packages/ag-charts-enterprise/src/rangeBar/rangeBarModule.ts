import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RangeColumnSeries, RangeBarSeries } from './rangeBar';
import { RANGE_COLUMN_DEFAULTS, RANGE_BAR_DEFAULTS } from './rangeBarDefaults';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeColumnModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-column',
    instanceConstructor: RangeColumnSeries,
    seriesDefaults: RANGE_COLUMN_DEFAULTS,
    themeTemplate: RANGE_BAR_SERIES_THEME,
    groupable: true,
};

export const RangeBarModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    instanceConstructor: RangeBarSeries,
    seriesDefaults: RANGE_BAR_DEFAULTS,
    themeTemplate: RANGE_BAR_SERIES_THEME,
    groupable: true,
};
