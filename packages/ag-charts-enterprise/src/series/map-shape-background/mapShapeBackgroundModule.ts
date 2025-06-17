import { type AgMapShapeBackgroundOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';

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
            fill: { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] }, // TODO: mix backgroundColor and foregroundColor?
            stroke: { $ref: 'chartBackgroundColor' },
            strokeWidth: 1,
            // @ts-expect-error undocumented-option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: [
                    {
                        $mix: [
                            { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
                            'black',
                            0.15,
                        ],
                    },
                    {
                        $mix: [
                            { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
                            'white',
                            0.15,
                        ],
                    },
                ] as any,
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
            fillPatternDefaults: {
                ...applyMapPalette(_ModuleSupport.FILL_PATTERN_DEFAULTS),
                fill: { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
                stroke: { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
            },
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
