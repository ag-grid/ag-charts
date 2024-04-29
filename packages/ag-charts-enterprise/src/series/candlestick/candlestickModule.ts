import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { CandlestickSeries } from './candlestickSeries';
import { CANDLESTICK_SERIES_THEME } from './candlestickThemes';

export const CandlestickModule: _ModuleSupport.SeriesModule<'candlestick'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'candlestick',
    instanceConstructor: CandlestickSeries,
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
            position: _Theme.POSITION.LEFT,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
            position: _Theme.POSITION.BOTTOM,
        },
    ],
    themeTemplate: CANDLESTICK_SERIES_THEME,
    groupable: false,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const { fills: DEFAULT_FILLS, strokes: DEFAULT_STROKES } = properties.get(
            _Theme.DEFAULT_COLOURS
        ) as unknown as _ModuleSupport.DefaultColors;
        return {
            item: {
                up: {
                    fill: userPalette ? 'transparent' : DEFAULT_FILLS.GREEN,
                    stroke: userPalette ? strokes[0] : DEFAULT_STROKES.GREEN,
                },
                down: {
                    fill: userPalette ? fills[0] : DEFAULT_FILLS.RED,
                    stroke: userPalette ? strokes[0] : DEFAULT_STROKES.RED,
                },
            },
        };
    },
};
