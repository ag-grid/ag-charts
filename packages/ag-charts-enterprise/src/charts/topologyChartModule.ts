import { type AgTopologyChartOptions, SeriesAreaModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    topologyChartOptionsDefs,
} from 'ag-charts-core';

import { TopologyChart } from './topologyChart';

export const TopologyChartModule: ChartModuleDefinition<WithoutModuleOwnedOptions<AgTopologyChartOptions>> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [SeriesAreaModule],

    options: topologyChartOptionsDefs,

    themeOptions: commonChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
