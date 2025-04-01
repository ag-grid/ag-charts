import { type AgFlowProportionChartOptions, _ModuleSupport } from 'ag-charts-community';
import type { ChartModuleDefinition } from 'ag-charts-core';

import { FlowProportionChart } from './flowProportionChart';

const { isAgFlowProportionChartOptions, flowProportionChartOptionsDefs } = _ModuleSupport;

export const FlowProportionChartModule: ChartModuleDefinition<AgFlowProportionChartOptions<never>> = {
    type: 'chart',
    name: 'flow-proportion',
    enterprise: true,

    options: flowProportionChartOptionsDefs,

    detect: isAgFlowProportionChartOptions,
    create(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        return new FlowProportionChart(options, resources);
    },
};
