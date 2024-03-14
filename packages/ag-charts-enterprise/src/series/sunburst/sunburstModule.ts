import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { SunburstSeries } from './sunburstSeries';

const { EXTENDS_SERIES_DEFAULTS, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _Theme;

export const SunburstModule: _ModuleSupport.SeriesModule<'sunburst'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],

    identifier: 'sunburst',
    instanceConstructor: SunburstSeries,
    solo: true,
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            label: {
                fontSize: 14,
                minimumFontSize: 9,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                overflowStrategy: 'ellipsis',
                wrapping: 'never',
                spacing: 2,
            },
            secondaryLabel: {
                fontSize: 8,
                minimumFontSize: 7,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                overflowStrategy: 'ellipsis',
                wrapping: 'never',
            },
            sectorSpacing: 2,
            padding: 3,
            highlightStyle: {
                label: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                secondaryLabel: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
        gradientLegend: {
            enabled: true,
        },
    },
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        return { fills, strokes, colorRange: defaultColorRange };
    },
};
