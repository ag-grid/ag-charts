import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { RangeBarSeries } from './rangeBar';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

export const RangeBarModule: _ModuleSupport.SeriesModule<'range-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    instanceConstructor: RangeBarSeries,
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

    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
};
