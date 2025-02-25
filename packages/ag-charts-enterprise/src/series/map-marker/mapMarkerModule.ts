import { type AgMapMarkerSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type SeriesModuleDefinition, ValidationError, validate } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapMarkerSeries } from './mapMarkerSeries';
import { mapMarkerSeriesOptionsDef } from './mapMarkerSeriesOptionsDef';

const { DEFAULT_DIVERGING_SERIES_COLOR_RANGE, DEFAULT_COLOR_RANGE } = _ModuleSupport.ThemeSymbols;

export const MapMarkerModule: _ModuleSupport.SeriesModule<'map-marker'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-marker',
    moduleFactory: (ctx) => new MapMarkerSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            shape: 'circle',
            maxSize: 30,
            fillOpacity: 0.5,
            label: {
                color: { $ref: 'textColor' },
            },
        },
    },
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill, stroke } = _ModuleSupport.singleSeriesPaletteFactory(opts);
        const colorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOR_RANGE);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            fill,
            stroke,
            colorRange: userPalette === 'inbuilt' ? colorRange : [fills[0], fills[1]],
            defaultColorRange,
        };
    },
};

export const MapMarkerSeriesModule: SeriesModuleDefinition<AgMapMarkerSeriesOptions> = {
    type: 'series',
    name: 'map-marker',
    chartType: 'topology',
    enterprise: true,

    options: mapMarkerSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapMarkerSeries(ctx),
    validate(options, optionsDefs, path) {
        const result = validate(options, optionsDefs, path);

        if (result.valid?.idKey == null && (result.valid?.latitudeKey == null || result.valid?.longitudeKey == null)) {
            const extendPath = (key: string) => (path ? `${path}.${key}` : key);
            const message = `Either \`${extendPath('idKey')}\` or both \`${extendPath('latitudeKey')}\` and \`${extendPath('longitudeKey')}\` are required.`;
            result.errors.push(new ValidationError(message, path, true));
        }

        return result;
    },
};
