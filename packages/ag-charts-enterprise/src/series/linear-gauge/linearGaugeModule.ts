import { _ModuleSupport } from 'ag-charts-community';

import { LinearGaugeSeries } from './linearGaugeSeries';

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
            defaultColorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $interpolate: [{ $palette: 'secondDivergingColors' }, 5] },
                    { $palette: 'range2' },
                ],
            },
            scale: {
                // @ts-expect-error undocumented option
                defaultFill: { $path: ['./1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
                stroke: { $path: ['./2', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
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
        },
    },
};
