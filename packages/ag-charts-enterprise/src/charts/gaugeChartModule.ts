import { _ModuleSupport } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { GaugeChart } from './gaugeChart';

const { isAgGaugeChartOptions } = _ModuleSupport;

export const GaugeChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'gauge',

    detect: isAgGaugeChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new GaugeChart(options, resources);
    },
};
