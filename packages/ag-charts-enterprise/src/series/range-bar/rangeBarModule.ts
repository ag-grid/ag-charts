import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { RangeBarSeries } from './rangeBarSeries';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeBarModule: _ModuleSupport.SeriesModule<'range-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    moduleFactory: (ctx) => new RangeBarSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _Theme.swapAxisCondition(
        [
            { type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER, position: _Theme.CARTESIAN_POSITION.LEFT },
            { type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY, position: _Theme.CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
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
};
