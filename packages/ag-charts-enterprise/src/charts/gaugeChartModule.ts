import { _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { GaugeChart } from './gaugeChart';

const { isAgGaugeChartOptions } = _ModuleSupport;

export const GaugeChartModule: ChartModuleDefinition = {
    type: 'chart',
    name: 'gauge',

    detect: isAgGaugeChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new GaugeChart(options, resources);
    },
};
