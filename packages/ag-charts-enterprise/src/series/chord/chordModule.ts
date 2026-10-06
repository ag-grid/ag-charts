import { type AgChordSeriesOptions, VERSION } from 'ag-charts-community';
import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    SINGLE_SERIES_HIGHLIGHT_STYLE,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    undocumentedThemeOptions,
} from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { ChordSeries } from './chordSeries';
import { chordSeriesOptionsDef, chordSeriesThemeableOptionsDef } from './chordSeriesOptionsDef';

export const ChordSeriesModule: SeriesModuleDefinition<AgChordSeriesOptions> = {
    type: 'series',
    name: 'chord',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: chordSeriesOptionsDef,

    themeOptions: chordSeriesThemeableOptionsDef,
    themeTemplate: {
        series: {
            ...COMMON_SERIES_THEME_DEFAULTS,
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            highlight: SINGLE_SERIES_HIGHLIGHT_STYLE,
            tooltip: SERIES_TOOLTIP_THEME,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontSize: { $ref: 'seriesLabelFontSize' },
                fontWeight: { $ref: 'seriesLabelFontWeight' },
                color: { $ref: 'textColor' },
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                width: 10,
                cornerRadius: 0,
                fillOpacity: 1,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
                shadow: SHADOW_THEME_DEFAULTS,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                ...STROKE_STYLE_THEME_DEFAULTS,
                tension: 0.4,
                shadow: SHADOW_THEME_DEFAULTS,
            },
            ...undocumentedThemeOptions({
                selection: SERIES_SELECTION_THEME,
                fillGradientDefaults: FILL_GRADIENT_LINEAR_DEFAULTS,
                fillPatternDefaults: FILL_PATTERN_DEFAULTS,
                fillImageDefaults: FILL_IMAGE_DEFAULTS,
            }),
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },

    create: (ctx) => new ChordSeries(ctx),
};
