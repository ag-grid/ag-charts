import type { ChartModuleDefinition } from 'ag-charts-core';

import { VERSION } from '../version';
import { standaloneChartOptionsDefs } from './chartOptionsDefs';
import { StandaloneChart } from './standaloneChart';

const placeholderCreate = () => {
    throw new Error('Enterprise module placeholder cannot be initialised');
};

export const StandaloneChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'standalone',
    version: VERSION,

    options: standaloneChartOptionsDefs,

    create: (options, resources) => new StandaloneChart(options, resources),
};

export const TopologyChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'topology',
    placeholder: true,
    version: VERSION,

    options: {},

    create: placeholderCreate,
};
