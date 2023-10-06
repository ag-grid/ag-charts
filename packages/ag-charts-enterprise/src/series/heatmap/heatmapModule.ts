import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';

import { HEATMAP_DEFAULTS } from './heatmapDefaults';
import { HeatmapSeries } from './heatmapSeries';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

export const HeatmapModule: _ModuleSupport.SeriesModule<'heatmap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'heatmap',
    instanceConstructor: HeatmapSeries,
    seriesDefaults: HEATMAP_DEFAULTS,
    themeTemplate: HEATMAP_SERIES_THEME,
};
