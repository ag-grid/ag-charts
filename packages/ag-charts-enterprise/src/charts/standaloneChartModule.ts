import { type AgStandaloneChartOptions, SeriesAreaModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartModuleDefinition,
    type ModuleOwnedChartOptions,
    commonChartThemeTemplate,
    standaloneChartOptionsDefs,
} from 'ag-charts-core';

import { StandaloneChart } from './standaloneChart';

export const StandaloneChartModule: ChartModuleDefinition<Omit<AgStandaloneChartOptions, ModuleOwnedChartOptions>> = {
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
