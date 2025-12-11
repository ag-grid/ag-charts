import { type AgMapShapeSeriesOptions, VERSION } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SAFE_RANGE2_OPERATION,
    type SeriesModuleDefinition,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeSeries } from './mapShapeSeries';
import { mapShapeSeriesOptionsDef } from './mapShapeSeriesOptionsDef';

export const MapShapeSeriesModule: SeriesModuleDefinition<AgMapShapeSeriesOptions> = {
    type: 'series',
    name: 'map-shape',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapShapeSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $mapPalette: 'fill' },
                    ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    applyMapPalette(SAFE_RANGE2_OPERATION),
                ],
            },
            fillOpacity: 1,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            padding: 2,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                color: { $ref: 'chartBackgroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: 'bold',
                overflowStrategy: 'hide',
            },
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapShapeSeries(ctx),
};
