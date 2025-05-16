import { type AgLinearGaugePreset, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { LinearGaugeSeries } from './linearGaugeSeries';

export const LinearGaugeModule: _ModuleSupport.SeriesModule<'linear-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'linear-gauge',
    moduleFactory: (ctx) => new LinearGaugeSeries(ctx),
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        tooltip: {
            enabled: false,
        },
        series: {
            thickness: 50,
            defaultColorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $interpolate: [{ $palette: 'secondDivergingColors' }, 5] },
                    _ModuleSupport.SAFE_RANGE2_OPERATION,
                ],
            },
            scale: {
                // @ts-expect-error undocumented option
                defaultFill: { $path: ['./1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                stroke: { $path: ['./2', _ModuleSupport.SAFE_STROKE_FILL_OPERATION, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
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
            tooltip: {
                range: { $path: ['/tooltip/range', 10] },
            },
        },
    },
};

export const LinearGaugeSeriesModule: SeriesModuleDefinition<AgLinearGaugePreset> = {
    type: 'series',
    name: 'linear-gauge',
    chartType: 'gauge',
    enterprise: true,

    options: _ModuleSupport.linearGaugeSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new LinearGaugeSeries(ctx),
};
