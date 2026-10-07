import { type AgTreemapSeriesOptions, VERSION } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FONT_SIZE_RATIO,
    LABEL_BOXING_DEFAULTS,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    cycledFillThemeTemplate,
    seriesLabelFontWeightOr,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef, treemapSeriesThemeableOptionsDef } from './treemapSeriesOptionsDef';

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions> = {
    type: 'series',
    name: 'treemap',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: treemapSeriesOptionsDef,

    themeOptions: treemapSeriesThemeableOptionsDef,
    themeTemplate: {
        series: {
            ...SERIES_INTERACTION_THEME_DEFAULTS,
            fills: {
                $applyCycle: [
                    { $size: { $path: ['./data', { $path: '/data' }] } },
                    { $palette: 'fills' },
                    cycledFillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
                ],
            },
            strokes: {
                $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
            },
            colorScale: {
                fills: { $map: [{ color: { $value: '$1' } }, { $palette: 'divergingColors' }] },
                mode: 'continuous',
            },
            tooltip: SERIES_TOOLTIP_THEME,
            group: {
                label: {
                    ...LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'textColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'seriesLabelFontWeight' },
                    fontSize: { $ref: 'seriesLabelFontSize' },
                    fontFamily: { $ref: 'seriesLabelFontFamily' },
                    spacing: 4,
                },
                fill: undefined, // Override default fill
                fills: { $palette: 'hierarchyColors' },
                fillOpacity: 1,
                stroke: undefined, // Override default stroke
                strokeWidth: 1,
                strokeOpacity: 1,
                cornerRadius: 0,
                shadow: SHADOW_THEME_DEFAULTS,
                padding: 4,
                gap: 2,
                textAlign: 'left',
                interactive: true,
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
                    fontWeight: { $ref: 'seriesLabelFontWeight' },
                    fontSize: { $rem: [1.5, 'seriesLabelFontSize'] },
                    minimumFontSize: { $rem: [FONT_SIZE_RATIO.SMALLER, 'seriesLabelFontSize'] },
                    fontFamily: { $ref: 'seriesLabelFontFamily' },
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                    spacing: 2,
                },
                secondaryLabel: {
                    ...LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'chartBackgroundColor' },
                    fontStyle: undefined,
                    fontWeight: seriesLabelFontWeightOr(undefined),
                    fontSize: { $ref: 'seriesLabelFontSize' },
                    minimumFontSize: { $rem: [FONT_SIZE_RATIO.SMALLER, 'seriesLabelFontSize'] },
                    fontFamily: { $ref: 'seriesLabelFontFamily' },
                    wrapping: 'never',
                    overflowStrategy: 'ellipsis',
                },
                fill: undefined, // Override default fill
                fillOpacity: 1,
                stroke: undefined, // Override default stroke
                strokeWidth: { $isUserOption: ['../strokes/0', 2, { $isUserOption: ['./stroke', 2, 0] }] },
                strokeOpacity: 1,
                cornerRadius: 0,
                shadow: SHADOW_THEME_DEFAULTS,
                textAlign: 'center',
                verticalAlign: 'middle',
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
                childrenKey: 'children',
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
