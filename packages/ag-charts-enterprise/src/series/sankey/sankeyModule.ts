import { type AgSankeySeriesOptions, StandaloneChartModule, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    GLOW_THEME_DEFAULTS,
    ITEM_GLOW_BUCKETS,
    LABEL_BOXING_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    SAFE_FILLS_OPERATION,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    themeLineHeight,
    undocumentedThemeOptions,
    withSeriesGlowThemeDefaults,
} from 'ag-charts-core';

import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef, sankeySeriesThemeableOptionsDef } from './sankeySeriesOptionsDef';

export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: sankeySeriesOptionsDef,

    themeOptions: sankeySeriesThemeableOptionsDef,
    themeTemplate: {
        seriesArea: {
            padding: {
                top: 10,
                bottom: 10,
            },
        },
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            // The one highlight bucket serves nodes and links, so its `glow` follows the nodes' `glow` where it has none.
            highlight: {
                enabled: { $path: ['/highlight/enabled', true] },
                ...withSeriesGlowThemeDefaults(
                    {
                        unhighlightedItem: { opacity: 0.5 },
                    },
                    { item: ITEM_GLOW_BUCKETS },
                    '/series/$index/node/glow'
                ),
            },
            tooltip: SERIES_TOOLTIP_THEME,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                ...LABEL_OVERFLOW_DEFAULTS,
                enabled: true,
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontSize: { $ref: 'seriesLabelFontSize' },
                lineHeight: themeLineHeight('seriesLabelLineHeight'),
                fontWeight: { $ref: 'seriesLabelFontWeight' },
                color: { $ref: 'textColor' },
                spacing: 10,
                collision: { alwaysShow: false, collideWith: { shapes: false } },
            },
            node: {
                spacing: { $if: [{ $greaterThan: [{ $path: './minSpacing' }, 20] }, { $path: './minSpacing' }, 20] },
                minSpacing: 0,
                width: 10,
                cornerRadius: 0,
                alignment: 'justify',
                verticalAlignment: 'center',
                sort: 'auto',
                fillOpacity: 1,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
                shadow: SHADOW_THEME_DEFAULTS,
                glow: GLOW_THEME_DEFAULTS,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
                shadow: SHADOW_THEME_DEFAULTS,
                glow: GLOW_THEME_DEFAULTS,
            },
            ...undocumentedThemeOptions({
                selection: SERIES_SELECTION_THEME,
                fillGradientDefaults: FILL_GRADIENT_LINEAR_DEFAULTS,
                fillPatternDefaults: FILL_PATTERN_DEFAULTS,
                fillImageDefaults: FILL_IMAGE_DEFAULTS,
                defaultColorRange: { $palette: 'gradients' },
                defaultPatternFills: SAFE_FILLS_OPERATION,
            }),
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },

    create: (ctx) => new SankeySeries(ctx),
};
