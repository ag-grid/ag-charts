import { type AgMapShapeSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef } from './mapShapeSeriesOptionsDef';

const { DEFAULT_DIVERGING_SERIES_COLOR_RANGE, DEFAULT_BACKGROUND_COLOUR, DEFAULT_COLOR_RANGE } =
    _ModuleSupport.ThemeSymbols;

export const MapShapeModule: _ModuleSupport.SeriesModule<'map-shape'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape',
    moduleFactory: (ctx) => new MapShapeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            fillOpacity: 1,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            padding: 2,
            label: {
                color: { $ref: 'backgroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: 'bold',
                overflowStrategy: 'hide',
            },
        },
    },
    paletteFactory: (opts) => {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = opts;
        const { fill } = _ModuleSupport.singleSeriesPaletteFactory(opts);
        const colorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOR_RANGE);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        const { fills } = takeColors(colorsCount);
        return {
            fill,
            stroke: themeTemplateParameters.get(DEFAULT_BACKGROUND_COLOUR) as string,
            colorRange: userPalette === 'inbuilt' ? colorRange : [fills[0], fills[1]],
            defaultColorRange,
        };
    },
};

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,

    options: mapShapeSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeSeries(ctx),
};
