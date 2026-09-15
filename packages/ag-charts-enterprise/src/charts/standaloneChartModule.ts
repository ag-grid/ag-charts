import { type AgStandaloneChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { SeriesAreaModule } from '../features/series-area/seriesAreaModule';
import { StandaloneChart } from './standaloneChart';

const { standaloneChartOptionsDefs, commonChartThemeTemplate } = _ModuleSupport;

export const StandaloneChartModule: ChartModuleDefinition<
    Omit<AgStandaloneChartOptions, _ModuleSupport.ModuleOwnedChartOptions>
> = {
    type: 'chart',
    name: 'standalone',
    enterprise: true,
    version: VERSION,
    dependencies: [SeriesAreaModule],

    options: standaloneChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new StandaloneChart(options, resources);
    },
};
