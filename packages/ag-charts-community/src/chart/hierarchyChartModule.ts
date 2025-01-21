import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { HierarchyChart } from './hierarchyChart';
import { isAgHierarchyChartOptions } from './mapping/types';

export const HierarchyChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'hierarchy',

    detect: isAgHierarchyChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new HierarchyChart(options, resources);
    },
};
