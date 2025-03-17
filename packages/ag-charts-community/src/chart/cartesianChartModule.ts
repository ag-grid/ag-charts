import type { ChartModuleDefinition } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { CartesianChart } from './cartesianChart';
import type { TransferableResources } from './chart';
import { cartesianChartOptionsDefs } from './chartOptionsDefs';
import { isAgCartesianChartOptions } from './mapping/types';

export const CartesianChartModule: ChartModuleDefinition<AgCartesianChartOptions> = {
    type: 'chart',
    name: 'cartesian',

    options: cartesianChartOptionsDefs,

    detect: isAgCartesianChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new CartesianChart(options, resources);
    },
};
