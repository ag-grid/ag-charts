import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { SunburstSeries } from './sunburstSeries';

const { EXTENDS_SERIES_DEFAULTS, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _Theme;

export const SunburstSeriesModule: _ModuleSupport.SeriesModule<'sunburst'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],

    identifier: 'sunburst',
    instanceConstructor: SunburstSeries,
    seriesDefaults: {},
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        label: {
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            wrapping: 'never',
        },
        secondaryLabel: {
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            wrapping: 'never',
        },
        sectorSpacing: 1,
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
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        return { fills, strokes, colorRange: defaultColorRange };
    },
};
