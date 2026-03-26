import { type AgStandaloneChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { StandaloneChart } from './standaloneChart';

const { standaloneChartOptionsDefs } = _ModuleSupport;

export const StandaloneChartModule: ChartModuleDefinition<AgStandaloneChartOptions> = {
    type: 'chart',
    name: 'standalone',
    enterprise: true,
    version: VERSION,

    options: standaloneChartOptionsDefs,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new StandaloneChart(options, resources);
    },
};
