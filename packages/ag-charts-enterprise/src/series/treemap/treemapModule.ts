import { type AgTreemapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef } from './treemapSeriesOptionsDef';

const { FONT_SIZE_RATIO } = _ModuleSupport;

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions> = {
    type: 'series',
    name: 'treemap',
    chartType: 'standalone',
    enterprise: true,
    solo: true,

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
                            ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                            ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                            ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                        ],
                    },
                ],
            },
            strokes: {
                $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
            },
            colorRange: { $palette: 'divergingColors' },
            undocumentedGroupFills: { $palette: 'hierarchyColors' },
            undocumentedGroupStrokes: { $palette: 'secondHierarchyColors' },
            group: {
                label: {
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'textColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    spacing: 4,
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: 1,
                padding: 4,
                gap: 2,
                textAlign: 'left',
            },
            tile: {
                label: {
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
            },
            // Override defaults
            highlightStyle: {
                group: {
                    label: {
                        color: { $ref: 'textColor' },
                    },
                    fill: 'rgba(255,255,255, 0.33)',
                    stroke: `rgba(0, 0, 0, 0.4)`,
                    strokeWidth: 2,
                },
                tile: {
                    label: {
                        color: { $ref: 'chartBackgroundColor' },
                    },
                    secondaryLabel: {
                        color: { $ref: 'chartBackgroundColor' },
                    },
                    fill: 'rgba(255,255,255, 0.33)',
                    stroke: `rgba(0, 0, 0, 0.4)`,
                    strokeWidth: 2,
                },
            },
        },
        gradientLegend: {
            enabled: true,
            ..._ModuleSupport.LEGEND_CONTAINER_THEME,
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new TreemapSeries(ctx),
};
