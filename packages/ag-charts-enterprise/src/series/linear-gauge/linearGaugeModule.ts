import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { LinearGaugeSeries } from './linearGaugeSeries';

const {
    FONT_WEIGHT,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    POLAR_AXIS_TYPE,
} = _Theme;

export const LinearGaugeModule: _ModuleSupport.SeriesModule<'linear-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'linear-gauge',
    moduleFactory: (ctx) => new LinearGaugeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        { type: POLAR_AXIS_TYPE.ANGLE_NUMBER, line: { enabled: false } },
        { type: POLAR_AXIS_TYPE.RADIUS_NUMBER, line: { enabled: false } },
    ],
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        series: {
            thickness: 20,
            bar: {
                strokeWidth: 0,
            },
            target: {
                fill: DEFAULT_LABEL_COLOUR,
                stroke: DEFAULT_LABEL_COLOUR,
                size: 10,
                placement: 'middle',
                spacing: 5,
                label: {
                    enabled: true,
                    fontWeight: FONT_WEIGHT.NORMAL,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    color: DEFAULT_LABEL_COLOUR,
                    spacing: 5,
                },
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
            tooltip: {
                enabled: false,
            },
        },
    },
    paletteFactory(params) {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = params;
        const { fills } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(_Theme.DEFAULT_GAUGE_SERIES_COLOUR_RANGE) as
            | string[]
            | undefined;
        const hierarchyFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        const colorRange = userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]];
        return {
            background: {
                defaultFill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
            defaultColorStops: colorRange,
        };
    },
};
