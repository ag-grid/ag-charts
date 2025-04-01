import { type AgMapShapeSeriesOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor, SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef } from './mapShapeSeriesOptionsDef';

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
            fill: { $palette: 'fill' },
            stroke: { $ref: 'backgroundColor' },
            colorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $palette: 'divergingColors' },
                    _ModuleSupport.SAFE_RANGE2_OPERATION,
                ],
            },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
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
        tooltip: {
            range: 'exact',
        },
    },
};

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions<never>> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,

    options: mapShapeSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeSeries(ctx),
};
