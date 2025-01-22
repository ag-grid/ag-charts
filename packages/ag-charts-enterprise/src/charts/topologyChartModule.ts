import { _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { TopologyChart } from './topologyChart';

const { isAgTopologyChartOptions } = _ModuleSupport;

export const TopologyChartModule: ChartModuleDefinition = {
    type: 'chart',
    name: 'topology',

    detect: isAgTopologyChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
