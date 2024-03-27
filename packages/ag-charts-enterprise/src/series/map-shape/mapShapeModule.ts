import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';

const {
    EXTENDS_SERIES_DEFAULTS,
    DEFAULT_INVERTED_LABEL_COLOUR,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_BACKGROUND_COLOUR,
    singleSeriesPaletteFactory,
} = _Theme;

export const MapShapeModule: _ModuleSupport.SeriesModule<'map-shape'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape',
    instanceConstructor: MapShapeSeries,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            fillOpacity: 1,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            padding: 2,
            label: {
                color: DEFAULT_INVERTED_LABEL_COLOUR,
                fontWeight: 'bold',
                overflowStrategy: 'hide',
            },
        },
    },
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill } = singleSeriesPaletteFactory(opts);
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            fill,
            stroke: properties.get(DEFAULT_BACKGROUND_COLOUR) as string,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};
