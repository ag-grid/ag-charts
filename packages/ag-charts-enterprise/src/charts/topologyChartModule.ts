import { type AgTopologyChartOptions, VERSION } from 'ag-charts-community';
import type { ChartTypeHost } from 'ag-charts-core';
import {
    type ChartModuleDefinition,
    type WithoutModuleOwnedOptions,
    commonChartOptionsDefs,
    commonChartThemeTemplate,
    topologyChartOptionsDefs,
} from 'ag-charts-core';

import { type TopologyChartEnv, TopologyChartType } from './topologyChart';

export const TopologyChartModule: ChartModuleDefinition<
    WithoutModuleOwnedOptions<AgTopologyChartOptions>,
    TopologyChartEnv
> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,
    version: VERSION,

    options: topologyChartOptionsDefs,

    themeOptions: commonChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(host: ChartTypeHost<TopologyChartEnv>) {
        return new TopologyChartType(host);
    },
};
