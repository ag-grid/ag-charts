import { type AgTopologyChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    topologyChartOptionsDefs,
} from 'ag-charts-core';

import { TopologyChartType } from './topologyChart';

export const TopologyChartModule: ChartModuleDefinition<WithoutModuleOwnedOptions<AgTopologyChartOptions>> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,
    version: VERSION,

    options: topologyChartOptionsDefs,

    themeOptions: commonChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(host: _ModuleSupport.ChartTypeHost) {
        return new TopologyChartType(host);
    },
};
