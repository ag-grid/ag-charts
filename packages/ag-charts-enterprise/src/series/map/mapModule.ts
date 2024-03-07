import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapSeries } from './mapSeries';

const {
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_INVERTED_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_BACKGROUND_COLOUR,
    singleSeriesPaletteFactory,
} = _Theme;

export const MapModule: _ModuleSupport.SeriesModule<'map'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map',
    instanceConstructor: MapSeries,
    seriesDefaults: {},
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            fillOpacity: 1,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            background: {
                strokeWidth: 0,
                fillOpacity: 0.2,
            },
            marker: {
                __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
                maxSize: 30,
                fillOpacity: 0.5,
            },
            tooltip: {
                position: {
                    type: 'node',
                },
            },
        },
        legend: {
            enabled: false,
        },
        gradientLegend: {
            enabled: false,
        },
    },
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill, stroke } = singleSeriesPaletteFactory(opts);
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            fill,
            stroke: undefined!,
            background: { fill, stroke },
            marker: { fill, stroke },
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
            __POLYGON_STROKE: properties.get(DEFAULT_BACKGROUND_COLOUR),
            __LINE_STRING_STROKE: fill,
            __POLYGON_LABEL: {
                color: properties.get(DEFAULT_INVERTED_LABEL_COLOUR),
                fontWeight: 'bold',
            },
            __MARKER_LABEL: {
                color: properties.get(DEFAULT_LABEL_COLOUR),
                fontWeight: 'normal',
            },
        };
    },
};
