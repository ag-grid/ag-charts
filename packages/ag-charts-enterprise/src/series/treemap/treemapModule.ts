import { type AgTreemapSeriesOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';

import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef } from './treemapSeriesOptionsDef';

const { FONT_SIZE_RATIO } = _ModuleSupport;

export const TreemapModule: _ModuleSupport.SeriesModule<'treemap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],
    identifier: 'treemap',
    moduleFactory: (ctx) => new TreemapSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    solo: true,
    themeTemplate: {
        series: {
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            colorRange: { $palette: 'divergingColors' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
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
                    color: { $ref: 'backgroundColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $rem: [1.5] },
                    minimumFontSize: { $rem: [FONT_SIZE_RATIO.SMALLER] },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                    spacing: 2,
                },
                secondaryLabel: {
                    enabled: true,
                    color: { $ref: 'backgroundColor' },
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: { $ref: 'fontSize' },
                    minimumFontSize: { $rem: [FONT_SIZE_RATIO.SMALLER] },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'never',
                    overflowStrategy: 'ellipsis',
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: 0,
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
                        color: { $ref: 'backgroundColor' },
                    },
                    secondaryLabel: {
                        color: { $ref: 'backgroundColor' },
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

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions<never>> = {
    type: 'series',
    name: 'treemap',
    chartType: 'hierarchy',
    enterprise: true,

    options: treemapSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new TreemapSeries(ctx),
};
