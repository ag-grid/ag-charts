import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';
import { mapShapeBackgroundSeriesOptionsDef } from './mapShapeBackgroundSeriesOptionsDef';

export const MapShapeBackgroundModule: _ModuleSupport.SeriesModule<'map-shape-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape-background',
    moduleFactory: (ctx) => new MapShapeBackgroundSeries(ctx),
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            fill: { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
            stroke: { $ref: 'chartBackgroundColor' },
            strokeWidth: 1,
            // @ts-expect-error undocumented-option
            fillGradientDefaults: applyMapPalette(_ModuleSupport.FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS),
            fillPatternDefaults: applyMapPalette(_ModuleSupport.FILL_PATTERN_HIERARCHY_DEFAULTS),
            fillImageDefaults: applyMapPalette(_ModuleSupport.FILL_IMAGE_DEFAULTS),
        },
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
