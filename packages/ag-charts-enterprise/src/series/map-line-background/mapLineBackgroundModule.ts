import type { AgMapLineBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapLineBackgroundSeries } from './mapLineBackgroundSeries';
import { mapLineBackgroundSeriesOptionsDef } from './mapLineBackgroundSeriesOptionsDef';

export const MapLineBackgroundSeriesModule: SeriesModuleDefinition<AgMapLineBackgroundOptions> = {
    type: 'series',
    name: 'map-line-background',
    chartType: 'topology',
    enterprise: true,

    options: mapLineBackgroundSeriesOptionsDef,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: { $path: ['/1', { $mapPalette: 'stroke' }, { $mapPalette: 'secondHierarchyColors' }] },
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new MapLineBackgroundSeries(ctx),
};
