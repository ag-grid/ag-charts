import { type AgMapShapeBackgroundOptions, VERSION } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_HIERARCHY_DEFAULTS,
    type SeriesModuleDefinition,
} from 'ag-charts-core';

import { TopologyChartModule } from '../../charts/topologyChartModule';
import { MAP_THEME_DEFAULTS, applyMapPalette } from '../map-util/mapThemeDefaults';
import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';
import { mapShapeBackgroundSeriesOptionsDef } from './mapShapeBackgroundSeriesOptionsDef';

export const MapShapeBackgroundSeriesModule: SeriesModuleDefinition<AgMapShapeBackgroundOptions> = {
    type: 'series',
    name: 'map-shape-background',
    chartType: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [TopologyChartModule],

    options: mapShapeBackgroundSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            fill: applyMapPalette({
                $applySwitch: [
                    { $path: 'type' },
                    { $path: ['/1', { $mapPalette: 'fill' }, { $mapPalette: 'hierarchyColors' }] },
                    ['gradient', FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS],
                    ['image', FILL_IMAGE_DEFAULTS],
                    ['pattern', FILL_PATTERN_HIERARCHY_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
    },

    create: (ctx) => new MapShapeBackgroundSeries(ctx),
};
