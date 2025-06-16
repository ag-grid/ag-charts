import { type AgMapLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapLineSeries } from './mapLineSeries';
import { mapLineSeriesOptionsDef } from './mapLineSeriesOptionsDef';

export const MapLineModule: _ModuleSupport.SeriesModule<'map-line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line',
    moduleFactory: (ctx) => new MapLineSeries(ctx),
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: _ModuleSupport.SAFE_STROKE_FILL_OPERATION,
            // @ts-expect-error undocumented option
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    _ModuleSupport.SAFE_RANGE2_OPERATION,
                ],
            },
            strokeWidth: 1,
            maxStrokeWidth: 3,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: true,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            highlight: _ModuleSupport.multiSeriesHighlightStyle(false),
        },
        tooltip: {
            range: 'exact',
        },
    },
};

export const MapLineSeriesModule: SeriesModuleDefinition<AgMapLineSeriesOptions> = {
    type: 'series',
    name: 'map-line',
    chartType: 'topology',
    enterprise: true,

    options: mapLineSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new MapLineSeries(ctx),
};
