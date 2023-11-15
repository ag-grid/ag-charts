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
        colorRange: ['#cb4b3f', '#6acb64'],
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
    paletteFactory: ({ takeColors, colorsCount }) => {
        const { fills, strokes } = takeColors(colorsCount);
        return { fills, strokes };
    },
};
