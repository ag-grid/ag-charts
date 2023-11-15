import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const { NORMAL, EXTENDS_SERIES_DEFAULTS, DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _Theme;

export const TreemapSeriesModule: _ModuleSupport.SeriesModule<'treemap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],

    identifier: 'treemap',
    instanceConstructor: TreemapSeries,
    seriesDefaults: {},
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        colorRange: ['#cb4b3f', '#6acb64'],
        group: {
            label: {
                enabled: true,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
            },
            fill: undefined, // Override default fill
            stroke: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            strokeWidth: 1,
            padding: 3,
        },
        tile: {
            label: {
                enabled: true,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 18,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'on-space',
                spacing: 2,
            },
            secondaryLabel: {
                enabled: true,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'never',
                overflow: 'never',
            },
            fill: undefined, // Override default fill
            stroke: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            strokeWidth: 1,
            padding: 3,
        },
        tileSpacing: 1,
        // Override defaults
        highlightStyle: {
            group: {
                label: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
            tile: {
                label: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                secondaryLabel: {
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
    },
    paletteFactory: ({ takeColors, colorsCount }) => {
        const { fills, strokes } = takeColors(colorsCount);
        return { fills, strokes };
    },
};
