import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { WaterfallSeries } from './waterfallSeries';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    solo: true,
    moduleFactory: (ctx) => new WaterfallSeries(ctx),
    tooltipDefaults: { range: 'exact' },
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
    themeTemplate: WATERFALL_SERIES_THEME,
    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
        if (userPalette === 'user-indexed') {
            const { fills, strokes } = takeColors(colorsCount);
            return {
                line: { stroke: palette.neutral.stroke },
                item: {
                    positive: {
                        fill: fills[0],
                        stroke: strokes[0],
                    },
                    negative: {
                        fill: fills[1],
                        stroke: strokes[1],
                    },
                    total: {
                        fill: fills[2],
                        stroke: strokes[2],
                    },
                },
            };
        }
        return {
            line: { stroke: palette.neutral.stroke },
            item: {
                positive: {
                    fill: palette.up.fill,
                    stroke: palette.up.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
                negative: {
                    fill: palette.down.fill,
                    stroke: palette.down.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
                total: {
                    fill: palette.neutral.fill,
                    stroke: palette.neutral.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
            },
        };
    },
};
