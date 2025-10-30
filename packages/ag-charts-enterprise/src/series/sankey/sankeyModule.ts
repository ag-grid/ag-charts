import { type AgSankeySeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef } from './sankeySeriesOptionsDef';

export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,

    options: sankeySeriesOptionsDef,
    themeTemplate: {
        seriesArea: {
            padding: {
                top: 10,
                bottom: 10,
            },
        },
        series: {
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
            fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
            defaultColorRange: { $palette: 'gradients' },
            defaultPatternFills: _ModuleSupport.SAFE_FILLS_OPERATION,
            highlight: _ModuleSupport.singleSeriesHighlightStyle(),
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new SankeySeries(ctx),
};
