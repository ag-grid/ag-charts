import { type AgTopologyChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { SeriesAreaModule } from '../features/series-area/seriesAreaModule';
import { TopologyChart } from './topologyChart';

const { topologyChartOptionsDefs, commonChartThemeTemplate } = _ModuleSupport;

export const TopologyChartModule: ChartModuleDefinition<
    Omit<AgTopologyChartOptions, _ModuleSupport.ModuleOwnedChartOptions>
> = {
    type: 'chart',
    name: 'topology',
    enterprise: true,
    version: VERSION,
    dependencies: [SeriesAreaModule],

    options: topologyChartOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new TopologyChart(options, resources);
    },
};
