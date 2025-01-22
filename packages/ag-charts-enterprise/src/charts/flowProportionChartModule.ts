import { _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { FlowProportionChart } from './flowProportionChart';

const { isAgFlowProportionChartOptions } = _ModuleSupport;

export const FlowProportionChartModule: ChartModuleDefinition = {
    type: 'chart',
    name: 'flow-proportion',

    detect: isAgFlowProportionChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new FlowProportionChart(options, resources);
    },
};
