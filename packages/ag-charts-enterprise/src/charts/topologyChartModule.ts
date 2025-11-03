import { type AgTopologyChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { TopologyChart } from './topologyChart';

const { topologyChartOptionsDefs } = _ModuleSupport;

export const TopologyChartModule: ChartModuleDefinition<AgTopologyChartOptions> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,
    version: VERSION,

    options: topologyChartOptionsDefs,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
