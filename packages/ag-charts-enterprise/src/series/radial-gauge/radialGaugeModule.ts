import { _ModuleSupport } from 'ag-charts-community';

import { RadialGaugeSeries } from './radialGaugeSeries';

const {
    FONT_SIZE_RATIO,
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
            startAngle: 270,
            endAngle: 270 + 180,
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
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    color: { $ref: 'textColor' },
                    spacing: 12,
                },
            },
            bar: {
                strokeWidth: 0,
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
    },
};
