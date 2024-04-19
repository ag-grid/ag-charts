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
        ) as unknown as {
            fills: { [key: string]: string };
            strokes: { [key: string]: string };
        };
        return userPalette
            ? {
                  item: {
                      up: {
                          fill: 'transparent',
                          stroke: strokes[0],
                      },
                      down: {
                          fill: fills[0],
                          stroke: strokes[0],
                      },
                  },
              }
            : {
                  item: {
                      up: {
                          fill: DEFAULT_FILLS.GREEN,
                          stroke: DEFAULT_STROKES.GREEN,
                      },
                      down: {
                          fill: DEFAULT_FILLS.RED,
                          stroke: DEFAULT_STROKES.RED,
                      },
                  },
              };
    },
};
