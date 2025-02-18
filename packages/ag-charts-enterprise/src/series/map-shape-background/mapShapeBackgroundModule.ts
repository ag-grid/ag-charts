import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';
import { mapShapeBackgroundSeriesOptionsDef } from './mapShapeBackgroundSeriesOptionsDef';

const { DEFAULT_HIERARCHY_FILLS } = _ModuleSupport.ThemeSymbols;

export const MapShapeBackgroundModule: _ModuleSupport.SeriesModule<'map-shape-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape-background',
    moduleFactory: (ctx) => new MapShapeBackgroundSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: { $ref: 'backgroundColor' },
            strokeWidth: 1,
        },
    },
    paletteFactory: ({ themeTemplateParameters }) => {
        return { fill: themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS)?.[1] };
    },
};

export const MapShapeBackgroundSeriesModule: SeriesModuleDefinition<AgMapShapeBackgroundOptions> = {
    type: 'series',
    name: 'map-shape-background',
    chartType: 'topology',
    enterprise: true,

    options: mapShapeBackgroundSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeBackgroundSeries(ctx),
};
