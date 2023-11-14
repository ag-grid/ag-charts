import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const {
    NORMAL,
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
        colorRange: ['#cb4b3f', '#6acb64'],
        group: {
            label: {
                enabled: true,
                color: DEFAULT_INVERTED_LABEL_COLOUR,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
            },
            fill: undefined, // Override default fill
            stroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
            strokeWidth: 1,
            padding: 2,
        },
        tile: {
            label: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 18,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'on-space',
            },
            secondaryLabel: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                wrapping: 'never',
                overflow: 'never',
            },
            fill: undefined, // Override default fill
            stroke: DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
            strokeWidth: 1,
            padding: 3,
            spacing: 2,
        },
    },
};
