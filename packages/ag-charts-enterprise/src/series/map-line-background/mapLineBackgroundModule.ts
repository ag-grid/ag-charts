import { type AgMapLineBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapLineBackgroundSeries } from './mapLineBackgroundSeries';
import { mapLineBackgroundSeriesOptionsDef } from './mapLineBackgroundSeriesOptionsDef';

const { DEFAULT_HIERARCHY_STROKES } = _ModuleSupport.ThemeSymbols;

export const MapLineBackgroundModule: _ModuleSupport.SeriesModule<'map-line-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line-background',
    moduleFactory: (ctx) => new MapLineBackgroundSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
        },
    },
    paletteFactory: ({ themeTemplateParameters }) => {
        return {
            stroke: themeTemplateParameters.get(DEFAULT_HIERARCHY_STROKES)?.[1],
        };
    },
};

export const MapLineBackgroundSeriesModule: SeriesModuleDefinition<AgMapLineBackgroundOptions> = {
    type: 'series',
    name: 'map-line-background',
    chartType: 'topology',
    enterprise: true,

    options: mapLineBackgroundSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapLineBackgroundSeries(ctx),
};
