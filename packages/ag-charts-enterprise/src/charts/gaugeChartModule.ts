import { type AgGaugeChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { GaugeChart } from './gaugeChart';

const { isAgGaugeChartOptions, gaugeChartOptionsDefs } = _ModuleSupport;

export const GaugeChartModule: ChartModuleDefinition<_ModuleSupport.OmitChartAddons<AgGaugeChartOptions>> = {
    type: 'chart',
    name: 'gauge',

    options: gaugeChartOptionsDefs,

    detect: isAgGaugeChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new GaugeChart(options, resources);
    },
};
