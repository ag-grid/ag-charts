import type { ChartModuleDefinition } from 'ag-charts-core';

import { VERSION } from '../version';

const placeholderCreate = () => {
    throw new Error('Enterprise module placeholder cannot be initialised');
};

export const StandaloneChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'standalone',
    placeholder: true,
    version: VERSION,

    options: {},

    create: placeholderCreate,
};

export const TopologyChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'topology',
    placeholder: true,
    version: VERSION,

    options: {},

    create: placeholderCreate,
};
