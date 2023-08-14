import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RangeAreaSeries } from './rangeArea';
import { RANGE_AREA_DEFAULTS } from './rangeAreaDefaults';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

export const RangeAreaModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-area',
    instanceConstructor: RangeAreaSeries,
    seriesDefaults: RANGE_AREA_DEFAULTS,
    themeTemplate: RANGE_AREA_SERIES_THEME,

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
};
