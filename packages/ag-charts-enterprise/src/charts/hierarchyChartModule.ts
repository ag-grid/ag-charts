import { _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { HierarchyChart } from './hierarchyChart';

const { isAgHierarchyChartOptions } = _ModuleSupport;

export const HierarchyChartModule: ChartModuleDefinition = {
    type: 'chart',
    name: 'hierarchy',

    detect: isAgHierarchyChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new HierarchyChart(options, resources);
    },
};
