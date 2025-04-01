import { type AgTopologyChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { TopologyChart } from './topologyChart';

const { isAgTopologyChartOptions, topologyChartOptionsDefs } = _ModuleSupport;

export const TopologyChartModule: ChartModuleDefinition<AgTopologyChartOptions<never>> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,

    options: topologyChartOptionsDefs,

    detect: isAgTopologyChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
