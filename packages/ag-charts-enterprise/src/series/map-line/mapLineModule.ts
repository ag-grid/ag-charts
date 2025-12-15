import { type AgMapLineSeriesOptions, VERSION } from 'ag-charts-community';
import {
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SAFE_RANGE2_OPERATION,
    SAFE_STROKE_FILL_OPERATION,
    type SeriesModuleDefinition,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapLineSeries } from './mapLineSeries';
import { mapLineSeriesOptionsDef } from './mapLineSeriesOptionsDef';

export const MapLineSeriesModule: SeriesModuleDefinition<AgMapLineSeriesOptions> = {
    type: 'series',
    name: 'map-line',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapLineSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: applyMapPalette(SAFE_STROKE_FILL_OPERATION),
            colorRange: {
                $if: [
                    { $eq: [{ $mapPalette: 'type' }, 'inbuilt'] },
                    { $mapPalette: 'divergingColors' },
                    applyMapPalette(SAFE_RANGE2_OPERATION),
                ],
            },
            strokeWidth: 1,
            maxStrokeWidth: 3,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                ...LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            highlight: applyMapPalette(MULTI_SERIES_HIGHLIGHT_STYLE),
        },
        tooltip: {
            range: 'exact',
        },
    },

    create: (ctx) => new MapLineSeries(ctx),
};
