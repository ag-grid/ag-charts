import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { CandlestickSeries } from './candlestickSeries';
import { CANDLESTICK_SERIES_THEME } from './candlestickThemes';

export const CandlestickModule: _ModuleSupport.SeriesModule<'candlestick'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'candlestick',
    moduleFactory: (ctx) => new CandlestickSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
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
    paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
        if (userPalette === 'user-indexed') {
            const { fills, strokes } = takeColors(colorsCount);
            return {
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
            };
        }

        return {
            item: {
                up: palette.up,
                down: palette.down,
            },
        };
    },
};
