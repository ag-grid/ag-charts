import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { TreemapSeries } from './treemapSeries';

const { NORMAL, EXTENDS_SERIES_DEFAULTS, DEFAULT_FONT_FAMILY } = _Theme;

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
        fills: ['#c16068', '#a2bf8a', '#ebcc87', '#80a0c3', '#b58dae', '#85c0d1'],
        colorRange: ['#cb4b3f', '#6acb64'],
        group: {
            label: {
                enabled: true,
                color: 'white',
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
            },
            fill: undefined, // Override default fill
            stroke: 'white',
            strokeWidth: 1,
            padding: 2,
        },
        tile: {
            label: {
                enabled: true,
                color: 'white',
                fontStyle: undefined,
                fontWeight: NORMAL,
                fontSize: 18,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'on-space',
            },
            secondaryLabel: {
                enabled: true,
                color: 'white',
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                minimumFontSize: 10,
                fontFamily: DEFAULT_FONT_FAMILY,
                wrapping: 'never',
                overflow: 'never',
            },
            fill: undefined, // Override default fill
            stroke: 'white',
            strokeWidth: 1,
            padding: 3,
            spacing: 2,
        },
        // Override defaults
        highlightStyle: {
            group: {
                label: {
                    color: undefined,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
            tile: {
                label: {
                    color: undefined,
                },
                secondaryLabel: {
                    color: undefined,
                },
                fill: undefined,
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
    },
};
