import { type AgSankeySeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef } from './sankeySeriesOptionsDef';

export const SankeyModule: _ModuleSupport.SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],
    solo: true,

    identifier: 'sankey',
    moduleFactory: (ctx) => new SankeySeries(ctx),

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
            // @ts-expect-error undocumented option
            fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
            fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
            defaultColorRange: { $palette: 'gradients' },
            defaultPatternFills: _ModuleSupport.SAFE_FILLS_OPERATION,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            highlight: {
                ..._ModuleSupport.singleSeriesHighlightStyle(),
            },
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 10,
            },
            node: {
                spacing: 20,
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
};

export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    chartType: 'standalone',
    enterprise: true,

    options: sankeySeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new SankeySeries(ctx),
};
