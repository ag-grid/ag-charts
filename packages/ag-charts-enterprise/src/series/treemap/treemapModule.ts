import { type AgTreemapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef } from './treemapSeriesOptionsDef';

const { FONT_SIZE_RATIO } = _ModuleSupport;

export const TreemapModule: _ModuleSupport.SeriesModule<'treemap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],
    identifier: 'treemap',
    moduleFactory: (ctx) => new TreemapSeries(ctx),
    solo: true,
    themeTemplate: {
        series: {
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            colorRange: { $palette: 'divergingColors' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
            fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
            undocumentedGroupFills: { $palette: 'hierarchyColors' },
            undocumentedGroupStrokes: { $palette: 'secondHierarchyColors' },
            group: {
                label: {
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
        },
    },
};

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions> = {
    type: 'series',
    name: 'treemap',
    chartType: 'standalone',
    enterprise: true,

    options: treemapSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new TreemapSeries(ctx),
};
