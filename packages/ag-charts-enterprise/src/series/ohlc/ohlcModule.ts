import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { OhlcSeries } from './ohlcSeries';
import { OHLC_SERIES_THEME } from './ohlcThemes';

export const OhlcModule: _ModuleSupport.SeriesModule<'ohlc'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'ohlc',
    instanceConstructor: OhlcSeries,
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
    themeTemplate: OHLC_SERIES_THEME,
    groupable: false,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const {
            strokes: [stroke],
        } = takeColors(colorsCount);
        const { strokes: DEFAULT_STROKES } = themeTemplateParameters.properties.get(
            _Theme.DEFAULT_COLOURS
        ) as unknown as {
            fills: { [key: string]: string };
            strokes: { [key: string]: string };
        };
        return {
            item: {
                up: {
                    stroke: userPalette ? stroke : DEFAULT_STROKES.GREEN,
                },
                down: {
                    stroke: userPalette ? stroke : DEFAULT_STROKES.RED,
                },
            },
        };
    },
};
