import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapMarkerSeries } from './mapMarkerSeries';

const {
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    singleSeriesPaletteFactory,
} = _Theme;

export const MapMarkerModule: _ModuleSupport.SeriesModule<'map-marker'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-marker',
    instanceConstructor: MapMarkerSeries,
    seriesDefaults: {},
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            background: {
                strokeWidth: 0,
                fillOpacity: 0.2,
            },
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
            marker: {
                __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
                enabled: true,
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
        tooltip: {
            range: 'exact',
        },
    },
    // @ts-expect-error When the types are properly exposed, this error should disappear
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill, stroke } = singleSeriesPaletteFactory(opts);
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
            background: { fill, stroke },
            marker: { fill, stroke },
        };
    },
};
