import { type AgMapShapeSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

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
                    { $palette: 'range2' },
                ],
            },
            // @ts-expect-error undocumented option
            defaultColorRange: { $palette: 'gradient' },
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
};

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,

    options: mapShapeSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeSeries(ctx),
};
