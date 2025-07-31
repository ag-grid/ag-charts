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
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
                    ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS],
                    ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ['pattern', _ModuleSupport.FILL_PATTERN_HIERARCHY_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            strokeWidth: 1,
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
