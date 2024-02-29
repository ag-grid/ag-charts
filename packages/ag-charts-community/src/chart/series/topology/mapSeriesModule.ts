import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
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
            tooltip: {
                position: {
                    type: 'node',
                },
            },
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
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
            fill,
            stroke,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};
