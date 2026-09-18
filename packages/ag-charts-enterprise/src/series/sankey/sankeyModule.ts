import { type AgSankeySeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    SAFE_FILLS_OPERATION,
    SERIES_SELECTION_THEME,
    type SeriesModuleDefinition,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef } from './sankeySeriesOptionsDef';

export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: sankeySeriesOptionsDef,
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
            highlight: {
                enabled: { $path: ['/highlight/enabled', true] },
                unhighlightedItem: {
                    opacity: 0.5,
                },
            },
            tooltip: { interaction: { enabled: false } },
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 10,
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
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
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
