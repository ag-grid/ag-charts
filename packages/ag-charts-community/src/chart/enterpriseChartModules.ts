import type { ChartModuleDefinition } from 'ag-charts-core';

const placeholderCreate = () => {
    throw new Error('Enterprise module placeholder cannot be initialised');
};

export const StandaloneChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'standalone',
    placeholder: true,

    options: {},

    create: placeholderCreate,
};

export const TopologyChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'topology',
    placeholder: true,

    options: {},

    create: placeholderCreate,
};
