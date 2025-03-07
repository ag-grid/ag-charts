import { type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { SunburstSeries } from './sunburstSeries';
import { sunburstSeriesOptionsDef } from './sunburstSeriesOptionsDef';

const { FONT_SIZE_RATIO } = _ModuleSupport;

export const SunburstModule: _ModuleSupport.SeriesModule<'sunburst'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],

    identifier: 'sunburst',
    moduleFactory: (ctx) => new SunburstSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    solo: true,
    themeTemplate: {
        series: {
            fills: { $palette: 'fills' },
            strokes: { $palette: 'strokes' },
            colorRange: { $palette: 'divergingColors' },
            // @ts-expect-error undocumented option
            defaultColorRange: { $palette: 'gradient' }, // TODO: update sunburst to handle 'gradients'
            label: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: [FONT_SIZE_RATIO.LARGE] },
                minimumFontSize: { $round: [{ $mul: [{ $ref: 'fontSize' }, 9 / 12] }] },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'backgroundColor' },
                overflowStrategy: 'ellipsis',
                wrapping: 'never',
                spacing: 2,
            },
            secondaryLabel: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: [FONT_SIZE_RATIO.SMALLEST] },
                minimumFontSize: { $round: [{ $mul: [{ $ref: 'fontSize' }, 7 / 12] }] },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'backgroundColor' },
                overflowStrategy: 'ellipsis',
                wrapping: 'never',
            },
            sectorSpacing: 2,
            padding: 3,
            highlightStyle: {
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
        gradientLegend: {
            enabled: true,
        },
    },
};

export const SunburstSeriesModule: SeriesModuleDefinition<AgSunburstSeriesOptions> = {
    type: 'series',
    name: 'sunburst',
    chartType: 'hierarchy',
    enterprise: true,

    options: sunburstSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new SunburstSeries(ctx),
};
