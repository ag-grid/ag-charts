import { type AgTreemapSeriesOptions, VERSION } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    FONT_SIZE_RATIO,
    LABEL_BOXING_DEFAULTS,
    SERIES_SELECTION_THEME,
    type SeriesModuleDefinition,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef } from './treemapSeriesOptionsDef';

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions> = {
    type: 'series',
    name: 'treemap',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: treemapSeriesOptionsDef,
    themeTemplate: {
        series: {
            fills: {
                $applyCycle: [
                    { $size: { $path: ['./data', { $path: '/data' }] } },
                    { $palette: 'fills' },
                    {
                        $applySwitch: [
                            { $path: ['/type', undefined, { $value: '$1' }] },
                            { $value: '$1' },
                            ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                            ['pattern', FILL_PATTERN_DEFAULTS],
                            ['image', FILL_IMAGE_DEFAULTS],
                        ],
                    },
                ],
            },
            strokes: {
                $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
            },
            colorScale: {
                fills: { $map: [{ color: { $value: '$1' } }, { $palette: 'divergingColors' }] },
            },
            group: {
                label: {
                    ...LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'textColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    spacing: 4,
                },
                fill: undefined, // Override default fill
                fills: { $palette: 'hierarchyColors' },
                stroke: undefined, // Override default stroke
                strokeWidth: 1,
                padding: 4,
                gap: 2,
                textAlign: 'left',
                highlight: {
                    enabled: { $circular: { $path: '/highlight/enabled' } },
                    unhighlightedItem: {
                        opacity: 0.2,
                        fillOpacity: 0.2,
                        strokeOpacity: 0.2,
                    },
                },
            },
            tile: {
                label: {
                    ...LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'chartBackgroundColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $rem: 1.5 },
                    minimumFontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                    spacing: 2,
                },
                secondaryLabel: {
                    ...LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'chartBackgroundColor' },
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: { $ref: 'fontSize' },
                    minimumFontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'never',
                    overflowStrategy: 'ellipsis',
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: { $isUserOption: ['../strokes/0', 2, { $isUserOption: ['./stroke', 2, 0] }] },
                padding: 3,
                gap: 1,
                highlight: {
                    enabled: { $circular: { $path: '/highlight/enabled' } },
                    unhighlightedItem: {
                        fillOpacity: 0.6,
                        strokeOpacity: 0.6,
                    },
                    unhighlightedBranch: {
                        fillOpacity: 0.2,
                        strokeOpacity: 0.2,
                    },
                },
                selection: SERIES_SELECTION_THEME,
            },
            ...undocumentedThemeOptions({
                undocumentedGroupStrokes: { $palette: 'secondHierarchyColors' },
            }),
        },
        legend: {
            enabled: {
                $and: [
                    { $path: '../series/0/colorKey' },
                    { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] },
                ],
            },
        },
        gradientLegend: {
            enabled: {
                $and: [
                    { $path: '../series/0/colorKey' },
                    { $not: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] } },
                ],
            },
        },
    },

    create: (ctx) => new TreemapSeries(ctx),
};
