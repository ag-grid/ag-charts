import { type AgSunburstSeriesOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';

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
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'radial',
                bounds: 'series',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: true,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
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

export const SunburstSeriesModule: SeriesModuleDefinition<AgSunburstSeriesOptions<never>> = {
    type: 'series',
    name: 'sunburst',
    chartType: 'hierarchy',
    enterprise: true,

    options: sunburstSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new SunburstSeries(ctx),
};
