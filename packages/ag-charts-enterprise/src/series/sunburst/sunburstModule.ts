import { _ModuleSupport } from 'ag-charts-community';

import { SunburstSeries } from './sunburstSeries';

const { DEFAULT_DIVERGING_SERIES_COLOR_RANGE } = _ModuleSupport.ThemeSymbols;

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
            label: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $round: [{ $mul: [{ $ref: 'fontSize' }, 14 / 12] }] },
                minimumFontSize: 9,
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'backgroundColor' },
                overflowStrategy: 'ellipsis',
                wrapping: 'never',
                spacing: 2,
            },
            secondaryLabel: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $round: [{ $mul: [{ $ref: 'fontSize' }, 8 / 12] }] },
                minimumFontSize: 7,
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
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOR_RANGE);
        return { fills, strokes, colorRange: defaultColorRange };
    },
};
