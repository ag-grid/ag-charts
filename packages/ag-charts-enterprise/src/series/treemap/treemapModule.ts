import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const {
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_HIERARCHY_STROKES,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_LABEL_COLOUR,
    FONT_WEIGHT,
} = _Theme;

export const TreemapModule: _ModuleSupport.SeriesModule<'treemap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],
    identifier: 'treemap',
    instanceConstructor: TreemapSeries,
    tooltipDefaults: { range: 'exact' },
    solo: true,
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            group: {
                label: {
                    enabled: true,
                    color: DEFAULT_LABEL_COLOUR,
                    fontStyle: undefined,
                    fontWeight: FONT_WEIGHT.NORMAL,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    spacing: 4,
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: 1,
                padding: 4,
                gap: 2,
                textAlign: 'left',
            },
            tile: {
                label: {
                    enabled: true,
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                    fontStyle: undefined,
                    fontWeight: FONT_WEIGHT.NORMAL,
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
                strokeWidth: 0,
                padding: 3,
                gap: 1,
            },
            // Override defaults
            highlightStyle: {
                group: {
                    label: {
                        color: DEFAULT_LABEL_COLOUR,
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
        gradientLegend: {
            enabled: true,
        },
    },
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const groupFills = properties.get(DEFAULT_HIERARCHY_FILLS);
        const groupStrokes = properties.get(DEFAULT_HIERARCHY_STROKES);
        return {
            fills,
            strokes,
            colorRange: defaultColorRange,
            undocumentedGroupFills: groupFills,
            undocumentedGroupStrokes: groupStrokes,
        };
    },
};
