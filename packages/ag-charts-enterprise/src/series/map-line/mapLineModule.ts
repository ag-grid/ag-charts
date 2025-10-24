import { type AgMapLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapLineSeries } from './mapLineSeries';
import { mapLineSeriesOptionsDef } from './mapLineSeriesOptionsDef';

export const MapLineSeriesModule: SeriesModuleDefinition<AgMapLineSeriesOptions> = {
    type: 'series',
    name: 'map-line',
    chartType: 'topology',
    enterprise: true,

    options: mapLineSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: applyMapPalette(_ModuleSupport.SAFE_STROKE_FILL_OPERATION),
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    applyMapPalette(_ModuleSupport.SAFE_RANGE2_OPERATION),
                ],
            },
            strokeWidth: 1,
            maxStrokeWidth: 3,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            highlight: applyMapPalette(_ModuleSupport.multiSeriesHighlightStyle(false)),
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new MapLineSeries(ctx),
};
