import type { ModuleDefinition } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { FlowProportionChart } from './flowProportionChart';
import { isAgFlowProportionChartOptions } from './mapping/types';

export const FlowProportionChartModule: ModuleDefinition = {
    type: 'chart',
    name: 'flow-proportion',

    detect: isAgFlowProportionChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new FlowProportionChart(options, resources);
    },
};
