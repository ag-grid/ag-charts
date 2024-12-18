import { _ModuleSupport } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const {
    DEFAULT_DIVERGING_SERIES_COLOR_RANGE,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_HIERARCHY_STROKES,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
} = _ModuleSupport.ThemeSymbols;

export const TreemapModule: _ModuleSupport.SeriesModule<'treemap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],
    identifier: 'treemap',
    moduleFactory: (ctx) => new TreemapSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    solo: true,
    themeTemplate: {
        series: {
            group: {
                label: {
                    enabled: true,
                    color: DEFAULT_LABEL_COLOUR,
                    fontStyle: undefined,
                    fontWeight: 'normal' as const,
                    fontSize: { ref: 'fontSize' as const },
                    fontFamily: { ref: 'fontFamily' as const },
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
                    fontWeight: 'normal' as const,
                    fontSize: 18,
                    minimumFontSize: 10,
                    fontFamily: { ref: 'fontFamily' as const },
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                    spacing: 2,
                },
                secondaryLabel: {
                    enabled: true,
                    color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: { ref: 'fontSize' as const },
                    minimumFontSize: 10,
                    fontFamily: { ref: 'fontFamily' as const },
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
                    fill: 'rgba(255,255,255, 0.33)',
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
                    fill: 'rgba(255,255,255, 0.33)',
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
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOR_RANGE);
        const groupFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        const groupStrokes = themeTemplateParameters.get(DEFAULT_HIERARCHY_STROKES);
        return {
            fills,
            strokes,
            colorRange: defaultColorRange,
            undocumentedGroupFills: groupFills,
            undocumentedGroupStrokes: groupStrokes,
        };
    },
};
