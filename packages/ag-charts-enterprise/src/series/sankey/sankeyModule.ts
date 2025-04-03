import { type AgSankeySeriesOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';

import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef } from './sankeySeriesOptionsDef';

export const SankeyModule: _ModuleSupport.SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],
    solo: true,

    identifier: 'sankey',
    moduleFactory: (ctx) => new SankeySeries(ctx),
    tooltipDefaults: { range: 'exact' },

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
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
            defaultColorRange: { $palette: 'gradients' },
            defaultPatternFills: _ModuleSupport.SAFE_FILLS_OPERATION,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            label: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 10,
            },
            node: {
                spacing: 20,
                width: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
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
    chartType: 'flow-proportion',
    enterprise: true,

    options: sankeySeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new SankeySeries(ctx),
};
