import { _ModuleSupport } from 'ag-charts-community';

import defaultColorStops from '../gauge-util/defaultColorStops';
import { LinearGaugeSeries } from './linearGaugeSeries';

const {
    ThemeSymbols: { DEFAULT_HIERARCHY_FILLS, DEFAULT_GAUGE_SERIES_COLOR_RANGE },
} = _ModuleSupport;

export const LinearGaugeModule: _ModuleSupport.SeriesModule<'linear-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'linear-gauge',
    moduleFactory: (ctx) => new LinearGaugeSeries(ctx),
    tooltipDefaults: { range: 10 },
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        tooltip: {
            enabled: false,
        },
        series: {
            thickness: 50,
            scale: {
                label: {
                    spacing: 11,
                },
            },
            bar: {
                strokeWidth: 0,
            },
            segmentation: {
                enabled: false,
                interval: {},
                spacing: 1,
            },
            // @ts-expect-error Private
            defaultTarget: {
                fill: { $ref: 'foregroundColor' },
                stroke: { $ref: 'foregroundColor' },
                size: 10,
                shape: 'triangle',
                placement: 'after',
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
            defaultScale: {
                label: {
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                },
            },
            label: {
                enabled: false,
                placement: 'inside-start',
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: [2] },
                minimumFontSize: 12,
                spacing: 18,
                color: { $ref: 'backgroundColor' },
            },
            margin: 4,
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
