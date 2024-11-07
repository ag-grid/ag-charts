import { _ModuleSupport } from 'ag-charts-community';

import { OhlcSeries } from './ohlcSeries';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;

export const OhlcModule: _ModuleSupport.SeriesModule<'ohlc'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'ohlc',
    moduleFactory: (ctx) => new OhlcSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate: {
        animation: { enabled: false },
        axes: {
            [CARTESIAN_AXIS_TYPE.NUMBER]: {
                crosshair: {
                    snap: false,
                },
            },
            [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
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
            const [stroke] = takeColors(colorsCount).strokes;
            return {
                item: {
                    up: { stroke },
                    down: { stroke },
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
