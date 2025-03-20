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
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: { $palette: 'fill' },
            // @ts-expect-error undocumented option
            colorRange: {
                $if: [
                    { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                    { $palette: 'divergingColors' },
                    { $palette: 'range2' },
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
