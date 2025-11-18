import { type AgMapShapeBackgroundOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

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
                    ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS],
                    ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ['pattern', _ModuleSupport.FILL_PATTERN_HIERARCHY_DEFAULTS],
                ],
            }),
            stroke: { $ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new MapShapeBackgroundSeries(ctx),
};
