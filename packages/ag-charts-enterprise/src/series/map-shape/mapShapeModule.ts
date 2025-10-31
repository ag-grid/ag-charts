import { type AgMapShapeSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef } from './mapShapeSeriesOptionsDef';

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,

    options: mapShapeSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $mapPalette: 'fill' },
                    ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                    ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    applyMapPalette(_ModuleSupport.SAFE_RANGE2_OPERATION),
                ],
            },
            fillOpacity: 1,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            padding: 2,
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                color: { $ref: 'chartBackgroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: 'bold',
                overflowStrategy: 'hide',
            },
            highlight: applyMapPalette(_ModuleSupport.multiSeriesHighlightStyle(true)),
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeSeries(ctx),
};
