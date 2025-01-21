import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { isAgStandaloneChartOptions } from './mapping/types';
import { StandaloneChart } from './standaloneChart';

export const StandaloneChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'standalone',

    detect: isAgStandaloneChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new StandaloneChart(options, resources);
    },
};
