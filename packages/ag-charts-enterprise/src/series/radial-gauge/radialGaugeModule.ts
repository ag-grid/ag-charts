import { type AgRadialGaugePreset, VERSION } from 'ag-charts-community';
import {
    FONT_SIZE_RATIO,
    LABEL_BOXING_DEFAULTS,
    SAFE_RANGE2_OPERATION,
    SAFE_STROKE_FILL_OPERATION,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    radialGaugeSeriesOptionsDef,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { GaugePresetModule } from '../../preset/gauge/gaugePresetModule';
import { RadialGaugeSeries } from './radialGaugeSeries';

export const RadialGaugeModule: SeriesModuleDefinition<AgRadialGaugePreset> = {
    type: 'series',
    name: 'radial-gauge',
    chartType: 'standalone',
    enterprise: true,
    dependencies: [GaugePresetModule],
    version: VERSION,

    options: radialGaugeSeriesOptionsDef,
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        tooltip: {
            enabled: false,
        },
        series: {
            ...SERIES_INTERACTION_THEME_DEFAULTS,
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.8,
            startAngle: 270,
            endAngle: 270 + 180,
            cornerRadius: 0,
            cornerMode: 'container',
            spacing: 0,
            scale: {
                min: 0,
                max: 1,
                fillMode: 'continuous',
                fillOpacity: 1,
                stroke: { $path: ['/2', SAFE_STROKE_FILL_OPERATION, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
                interval: {
                    ...undocumentedThemeOptions({
                        minSpacing: 0,
                        maxSpacing: 1000,
                    }),
                },
                label: {
                    enabled: true,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                    spacing: 12,
                    avoidCollisions: true,
                },
                ...undocumentedThemeOptions({
                    defaultFill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                }),
            },
            bar: {
                enabled: true,
                fillMode: 'continuous',
                fillOpacity: 1,
                stroke: 'black',
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
            },
            segmentation: {
                enabled: false,
                interval: {},
                spacing: 2,
            },
            needle: {
                enabled: false,
                fill: { $ref: 'foregroundColor' },
                fillOpacity: 1,
                stroke: 'black',
                strokeWidth: 0,
                ...STROKE_STYLE_THEME_DEFAULTS,
                spacing: 10,
            },
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: 56,
                minimumFontSize: 18 / 56,
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'textColor' },
                wrapping: 'on-space',
                overflowStrategy: 'ellipsis',
                spacing: 0,
            },
            secondaryLabel: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
                minimumFontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'subtleTextColor' },
                wrapping: 'on-space',
                overflowStrategy: 'ellipsis',
            },
            tooltip: {
                range: { $path: ['/tooltip/range', 10] },
                interaction: { enabled: false },
            },
            highlight: { enabled: true },
            selection: SERIES_SELECTION_THEME,
            ...undocumentedThemeOptions({
                defaultColorRange: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                        { $interpolate: [{ $palette: 'secondDivergingColors' }, 5] },
                        SAFE_RANGE2_OPERATION,
                    ],
                },
                defaultTarget: {
                    fill: { $ref: 'foregroundColor' },
                    stroke: { $ref: 'foregroundColor' },
                    size: 10,
                    shape: 'triangle',
                    placement: 'outside',
                    spacing: 5,
                    rotation: 0,
                    label: {
                        enabled: true,
                        fontStyle: 'normal',
                        fontWeight: { $ref: 'fontWeight' },
                        fontSize: { $ref: 'fontSize' },
                        fontFamily: { $ref: 'fontFamily' },
                        color: { $ref: 'textColor' },
                        spacing: 5,
                    },
                },
            }),
        },
    },

    create: (ctx) => new RadialGaugeSeries(ctx),
};
