import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { GaugeChart } from './gaugeChart';
import { isAgGaugeChartOptions } from './mapping/types';

export const GaugeChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'gauge',

    detect: isAgGaugeChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new GaugeChart(options, resources);
    },
};
