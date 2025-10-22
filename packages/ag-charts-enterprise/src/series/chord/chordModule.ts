import { type AgChordSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { ChordSeries } from './chordSeries';
import { chordSeriesOptionsDef } from './chordSeriesOptionsDef';

export const ChordModule: _ModuleSupport.SeriesModule<'chord'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],
    solo: true,

    identifier: 'chord',
    moduleFactory: (ctx) => new ChordSeries(ctx),

    themeTemplate: {
        series: {
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
            fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
            highlight: _ModuleSupport.mergeDefaults(
                {
                    unhighlightedItem: { opacity: 0.2 },
                },
                _ModuleSupport.singleSeriesHighlightStyle()
            ),
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                width: 10,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                tension: 0.4,
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },
};

export const ChordSeriesModule: SeriesModuleDefinition<AgChordSeriesOptions> = {
    type: 'series',
    name: 'chord',
    chartType: 'standalone',
    enterprise: true,

    options: chordSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new ChordSeries(ctx),
};
