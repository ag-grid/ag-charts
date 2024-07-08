import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapMarkerSeries } from './mapMarkerSeries';

const { DEFAULT_LABEL_COLOUR, DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, singleSeriesPaletteFactory } = _Theme;

export const MapMarkerModule: _ModuleSupport.SeriesModule<'map-marker'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-marker',
    instanceConstructor: MapMarkerSeries,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            shape: 'circle',
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
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            fill,
            stroke,
            colorRange: userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]],
        };
    },
};
