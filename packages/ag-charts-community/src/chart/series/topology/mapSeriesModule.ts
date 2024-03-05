import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import {
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { MapSeries } from './mapSeries';

export const MapSeriesModule: SeriesModule<'map'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
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
            label: {
                color: DEFAULT_LABEL_COLOUR,
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
        };
    },
};
