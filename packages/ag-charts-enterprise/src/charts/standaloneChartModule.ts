import { type AgStandaloneChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { StandaloneChart } from './standaloneChart';

const { isAgStandaloneChartOptions, standaloneChartOptionsDefs } = _ModuleSupport;

export const StandaloneChartModule: ChartModuleDefinition<_ModuleSupport.OmitChartAddons<AgStandaloneChartOptions>> = {
    type: 'chart',
    name: 'standalone',

    options: standaloneChartOptionsDefs,

    detect: isAgStandaloneChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new StandaloneChart(options, resources);
    },
};
