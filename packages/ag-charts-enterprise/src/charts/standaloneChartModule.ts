import { _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { StandaloneChart } from './standaloneChart';

const { isAgStandaloneChartOptions } = _ModuleSupport;

export const StandaloneChartModule: ChartModuleDefinition = {
    type: 'chart',
    name: 'standalone',

    detect: isAgStandaloneChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new StandaloneChart(options, resources);
    },
};
