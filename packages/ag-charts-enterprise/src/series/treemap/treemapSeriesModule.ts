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
        group: {
            label: {
                enabled: true,
                color: 'white', // The grey background is the same for all themes, so the label always needs to be white
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                spacing: 3,
            },
            fill: undefined, // Override default fill
            stroke: undefined, // Override default stroke
            strokeWidth: 0,
            padding: 6,
            gap: 4,
            textAlign: 'left',
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
                overflowStrategy: 'ellipsis',
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
                overflowStrategy: 'ellipsis',
            },
            fill: undefined, // Override default fill
            stroke: undefined, // Override default stroke
            strokeWidth: 1,
            padding: 3,
            gap: -1,
        },
        // Override defaults
        highlightStyle: {
            group: {
                label: {
                    color: 'white',
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
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        return { fills, strokes, colorRange: defaultColorRange };
    },
};
