import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { RadialGaugeSeries } from './radialGaugeSeries';

const {
    FONT_WEIGHT,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    singleSeriesPaletteFactory,
} = _Theme;

export const RadialGaugeModule: _ModuleSupport.SeriesModule<'radial-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'radial-gauge',
    moduleFactory: (ctx) => new RadialGaugeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        series: {
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.8,
            foreground: {
                strokeWidth: 0,
            },
            needle: {
                enabled: false,
                fill: DEFAULT_LABEL_COLOUR,
                spacing: 10,
            },
            label: {
                enabled: true,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 56,
                minimumFontSize: 18,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            secondaryLabel: {
                enabled: true,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 14,
                minimumFontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_MUTED_LABEL_COLOUR,
            },
        },
    },
    paletteFactory(params) {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = params;
        const { fill, stroke } = singleSeriesPaletteFactory(params);
        const { fills } = takeColors(colorsCount);
        const defaultColorRange = (
            themeTemplateParameters.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE) as string[] | undefined
        )
            ?.slice()
            .reverse();
        const hierarchyFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        return {
            foreground: {
                fill,
                stroke,
                colorRange: userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]],
            },
            background: {
                fill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
        };
    },
};
