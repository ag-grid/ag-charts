import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { OhlcSeries } from './ohlcSeries';

export const OhlcModule: _ModuleSupport.SeriesModule<'ohlc'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'ohlc',
    instanceConstructor: OhlcSeries,
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
    themeTemplate: {
        animation: { enabled: false },
        axes: {
            [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
                crosshair: {
                    snap: false,
                },
            },
            [_Theme.CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
                groupPaddingInner: 0,
                crosshair: {
                    enabled: true,
                },
            },
        },
    },
    groupable: false,
    paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
        if (userPalette === 'user-indexed') {
            const {
                strokes: [stroke],
            } = takeColors(colorsCount);
            return {
                item: {
                    up: {
                        stroke: stroke,
                    },
                    down: {
                        stroke: stroke,
                    },
                },
            };
        }

        return {
            item: {
                up: { stroke: palette.up.stroke },
                down: { stroke: palette.down.stroke },
            },
        };
    },
};
