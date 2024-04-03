import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapMarkerSeries } from './mapMarkerSeries';

const {
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_LABEL_COLOUR,
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
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            maxSize: 30,
            fillOpacity: 0.5,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
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
            stroke,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};
