import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { isAgTopologyChartOptions } from './mapping/types';
import { TopologyChart } from './topologyChart';

export const TopologyChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'topology',

    detect: isAgTopologyChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
