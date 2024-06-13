import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapLineSeries } from './mapLineSeries';

const { DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, singleSeriesPaletteFactory } =
    _Theme;

export const MapLineModule: _ModuleSupport.SeriesModule<'map-line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line',
    instanceConstructor: MapLineSeries,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            strokeWidth: 1,
            maxStrokeWidth: 3,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
        },
    },
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill } = singleSeriesPaletteFactory(opts);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
            stroke: fill,
        };
    },
};
