import { type AgHierarchyChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { HierarchyChart } from './hierarchyChart';

const { isAgHierarchyChartOptions, hierarchyChartOptionsDefs } = _ModuleSupport;

export const HierarchyChartModule: ChartModuleDefinition<AgHierarchyChartOptions> = {
    type: 'chart',
    name: 'hierarchy',

    options: hierarchyChartOptionsDefs,

    detect: isAgHierarchyChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new HierarchyChart(options, resources);
    },
};
