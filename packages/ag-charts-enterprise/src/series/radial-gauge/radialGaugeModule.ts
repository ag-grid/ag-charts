import { type AgRadialGaugePreset, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { FONT_SIZE_RATIO, radialGaugeSeriesOptionsDef } from 'ag-charts-core';

import { GaugePresetModule } from '../../preset/gaugePresetModule';
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
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.8,
            startAngle: 270,
            endAngle: 270 + 180,
            defaultColorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $interpolate: [{ $palette: 'secondDivergingColors' }, 5] },
                    _ModuleSupport.SAFE_RANGE2_OPERATION,
                ],
            },
            scale: {
                defaultFill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                stroke: { $path: ['/2', _ModuleSupport.SAFE_STROKE_FILL_OPERATION, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                label: {
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                    spacing: 12,
                },
            },
            bar: {
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
            segmentation: {
                enabled: false,
                interval: {},
                spacing: 2,
            },
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
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: 56,
                minimumFontSize: 18 / 56,
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'textColor' },
            },
            secondaryLabel: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
                minimumFontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                color: { $ref: 'subtleTextColor' },
            },
            tooltip: {
                range: { $path: ['/tooltip/range', 10] },
            },
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new RadialGaugeSeries(ctx),
};
