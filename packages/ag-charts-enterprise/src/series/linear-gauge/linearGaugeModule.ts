import { type AgLinearGaugePreset, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { FONT_SIZE, linearGaugeSeriesOptionsDef } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import { GaugePresetModule } from '../../preset/gaugePresetModule';
import { LinearGaugeSeries } from './linearGaugeSeries';

const themeTemplate: ExtensibleTheme<'linear-gauge'> = {
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
            defaultFill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
            stroke: { $path: ['/2', _ModuleSupport.SAFE_STROKE_FILL_OPERATION, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            label: {
                spacing: 11,
            },
        },
        bar: {
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
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
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: false,
            placement: 'inside-start',
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: 2 },
            minimumFontSize: FONT_SIZE.SMALL,
            spacing: 18,
            color: { $ref: 'chartBackgroundColor' },
        },
        margin: 4,
        tooltip: {
            range: { $path: ['/tooltip/range', 10] },
        },
    },
};

export const LinearGaugeModule: SeriesModuleDefinition<AgLinearGaugePreset> = {
    type: 'series',
    name: 'linear-gauge',
    chartType: 'standalone',
    enterprise: true,
    dependencies: [GaugePresetModule],
    version: VERSION,

    options: linearGaugeSeriesOptionsDef,
    themeTemplate,

    create: (ctx) => new LinearGaugeSeries(ctx),
};
