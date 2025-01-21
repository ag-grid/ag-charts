import { type ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import { CartesianChart } from './cartesianChart';
import type { TransferableResources } from './chart';
import { isAgCartesianChartOptions } from './mapping/types';

export const CartesianChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'cartesian',

    detect: isAgCartesianChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new CartesianChart(options, resources);
    },
};
