import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { isAgPolarChartOptions } from './mapping/types';
import { PolarChart } from './polarChart';

export const PolarChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'polar',

    detect: isAgPolarChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new PolarChart(options, resources);
    },
};
