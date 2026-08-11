import { type AgLinearGaugePreset, VERSION } from 'ag-charts-community';
import {
    FONT_SIZE,
    LABEL_BOXING_DEFAULTS,
    SAFE_RANGE2_OPERATION,
    SAFE_STROKE_FILL_OPERATION,
    SERIES_SELECTION_THEME,
    type SeriesModuleDefinition,
    linearGaugeSeriesOptionsDef,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import { GaugePresetModule } from '../../preset/gauge/gaugePresetModule';
import { LinearGaugeSeries } from './linearGaugeSeries';

const themeTemplate: ExtensibleTheme<'linear-gauge'> = {
    minWidth: 200,
    minHeight: 200,
    tooltip: {
        enabled: false,
    },
    series: {
        thickness: 50,
        scale: {
            stroke: { $path: ['/2', SAFE_STROKE_FILL_OPERATION, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            label: {
                spacing: 11,
            },
            ...undocumentedThemeOptions({
                defaultFill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
            }),
        },
        bar: {
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        },
        segmentation: {
            enabled: false,
            interval: {},
            spacing: 1,
        },
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            placement: 'inside-start',
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: 2 },
            minimumFontSize: FONT_SIZE.SMALL,
            spacing: 18,
            color: { $ref: 'chartBackgroundColor' },
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 10] },
        },
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
            margin: 4,
        }),
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
