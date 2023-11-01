import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const {
    NORMAL,
    DEFAULT_MUTED_LABEL_COLOUR,
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_FONT_FAMILY,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
    DEFAULT_INVERTED_LABEL_COLOUR,
} = _Theme;

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
        showInLegend: false,
        colorDomain: [-5, 5],
        colorRange: ['#cb4b3f', '#6acb64'],
        groupFill: '#272931',
        groupStroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
        groupStrokeWidth: 1,
        tileStroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
        tileStrokeWidth: 1,
        highlightGroups: true,
        nodePadding: 2,
        nodeGap: 0,
        title: {
            enabled: true,
            color: DEFAULT_INVERTED_LABEL_COLOUR,
            fontStyle: undefined,
            fontWeight: NORMAL,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            padding: 2,
        },
        subtitle: {
            enabled: true,
            color: DEFAULT_MUTED_LABEL_COLOUR,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 9,
            fontFamily: DEFAULT_FONT_FAMILY,
            padding: 2,
        },
        labels: {
            large: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 18,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'on-space',
            },
            medium: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 14,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'on-space',
            },
            small: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'on-space',
            },
            value: {
                style: {
                    enabled: true,
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    color: DEFAULT_LABEL_COLOUR,
                },
            },
        },
    },
};
