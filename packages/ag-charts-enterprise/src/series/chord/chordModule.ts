import { type AgChordSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { ChordSeries } from './chordSeries';
import { chordSeriesOptionsDef } from './chordSeriesOptionsDef';

const {
    ThemeSymbols: { DEFAULT_COLOR_RANGE },
} = _ModuleSupport;

export const ChordModule: _ModuleSupport.SeriesModule<'chord'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],
    solo: true,

    identifier: 'chord',
    tooltipDefaults: { range: 'exact' },
    moduleFactory: (ctx) => new ChordSeries(ctx),

    themeTemplate: {
        series: {
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
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                width: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
                tension: 0.4,
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },
    paletteFactory({ takeColors, colorsCount, themeTemplateParameters }) {
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        return {
            fills,
            strokes,
            defaultColorRange,
        };
    },
};

export const ChordSeriesModule: SeriesModuleDefinition<AgChordSeriesOptions> = {
    type: 'series',
    name: 'chord',
    chartType: 'flow-proportion',
    enterprise: true,

    options: chordSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new ChordSeries(ctx),
};
