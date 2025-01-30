import { _ModuleSupport } from 'ag-charts-community';

import defaultColorStops from '../gauge-util/defaultColorStops';
import { RadialGaugeSeries } from './radialGaugeSeries';

const {
    FONT_SIZE_RATIO,
    ThemeSymbols: { DEFAULT_HIERARCHY_FILLS, DEFAULT_GAUGE_SERIES_COLOR_RANGE },
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const RadialGaugeModule: _ModuleSupport.SeriesModule<'radial-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'radial-gauge',
    moduleFactory: (ctx) => new RadialGaugeSeries(ctx),
    tooltipDefaults: { range: 10 },
    defaultAxes: [
        { type: POLAR_AXIS_TYPE.ANGLE_NUMBER, line: { enabled: false } },
        { type: POLAR_AXIS_TYPE.RADIUS_NUMBER, line: { enabled: false } },
    ],
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        tooltip: {
            enabled: false,
        },
        series: {
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.8,
            bar: {
                strokeWidth: 0,
            },
            segmentation: {
                enabled: false,
                interval: {},
                spacing: 2,
            },
            // @ts-expect-error Private
            defaultTarget: {
                fill: { $ref: 'foregroundColor' },
                stroke: { $ref: 'foregroundColor' },
                size: 10,
                shape: 'triangle',
                placement: 'outside',
                spacing: 5,
                label: {
                    enabled: true,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                    spacing: 5,
                },
            },
            needle: {
                enabled: false,
                fill: { $ref: 'foregroundColor' },
                spacing: 10,
            },
            label: {
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: 56,
                minimumFontSize: 18 / 56,
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'textColor' },
            },
            secondaryLabel: {
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: [FONT_SIZE_RATIO.LARGE] },
                minimumFontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'subtleTextColor' },
            },
        },
        axes: {
            [POLAR_AXIS_TYPE.ANGLE_NUMBER]: {
                startAngle: 270,
                endAngle: 270 + 180,
                nice: false,
                line: {
                    enabled: false,
                },
            },
        },
    },
    paletteFactory(params) {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = params;
        const { fills } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_GAUGE_SERIES_COLOR_RANGE) as string[] | undefined;
        const hierarchyFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        const colorRange = userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]];
        return {
            scale: {
                defaultFill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
            defaultColorRange: defaultColorStops(colorRange),
        };
    },
};
