import { type AgWaterfallSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { WaterfallSeries } from './waterfallSeries';
import { waterfallSeriesOptionsDef } from './waterfallSeriesOptionsDef';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

const {
    ThemeConstants,
    ThemeSymbols: { DEFAULT_COLOR_RANGE },
} = _ModuleSupport;

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    solo: true,
    moduleFactory: (ctx) => new WaterfallSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _ModuleSupport.swapAxisCondition(
        [
            { type: ThemeConstants.CARTESIAN_AXIS_TYPE.NUMBER, position: ThemeConstants.CARTESIAN_POSITION.LEFT },
            { type: ThemeConstants.CARTESIAN_AXIS_TYPE.CATEGORY, position: ThemeConstants.CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: WATERFALL_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, palette, themeTemplateParameters }) => {
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        if (userPalette === 'user-indexed') {
            const { fills, strokes } = takeColors(colorsCount);
            return {
                line: { stroke: palette.neutral.stroke },
                item: {
                    positive: {
                        fill: fills[0],
                        stroke: strokes[0],
                        defaultColorRange,
                    },
                    negative: {
                        fill: fills[1],
                        stroke: strokes[1],
                        defaultColorRange,
                    },
                    total: {
                        fill: fills[2],
                        stroke: strokes[2],
                        defaultColorRange,
                    },
                },
            };
        }
        return {
            line: { stroke: palette.neutral.stroke },
            item: {
                positive: {
                    fill: palette.altUp.fill,
                    stroke: palette.altUp.stroke,
                    defaultColorRange,
                    label: {
                        color: { $ref: 'textColor' },
                    },
                },
                negative: {
                    fill: palette.altDown.fill,
                    stroke: palette.altDown.stroke,
                    defaultColorRange,
                    label: {
                        color: { $ref: 'textColor' },
                    },
                },
                total: {
                    fill: palette.neutral.fill,
                    stroke: palette.neutral.stroke,
                    defaultColorRange,
                    label: {
                        color: { $ref: 'textColor' },
                    },
                },
            },
        };
    },
};

export const WaterfallSeriesModule: SeriesModuleDefinition<AgWaterfallSeriesOptions> = {
    type: 'series',
    name: 'waterfall',
    chartType: 'cartesian',
    enterprise: true,

    options: waterfallSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new WaterfallSeries(ctx),
};
