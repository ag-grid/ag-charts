import { type AgTopologyChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { TopologyChart } from './topologyChart';

const { topologyChartOptionsDefs } = _ModuleSupport;

export const TopologyChartModule: ChartModuleDefinition<AgTopologyChartOptions> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,

    options: topologyChartOptionsDefs,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
