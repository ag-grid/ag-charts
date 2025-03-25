import { type ChartModuleDefinition } from 'ag-charts-core';

import {
    isAgFlowProportionChartOptions,
    isAgGaugeChartOptions,
    isAgHierarchyChartOptions,
    isAgStandaloneChartOptions,
    isAgTopologyChartOptions,
} from './mapping/types';

const placeholderCreate = () => {
    throw new Error('Enterprise module placeholder cannot be initialised');
};

export const FlowProportionChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'flow-proportion',
    placeholder: true,

    options: {},

    detect: isAgFlowProportionChartOptions,
    create: placeholderCreate,
};

export const GaugeChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'gauge',
    placeholder: true,

    options: {},

    detect: isAgGaugeChartOptions,
    create: placeholderCreate,
};

export const HierarchyChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'hierarchy',
    placeholder: true,

    options: {},

    detect: isAgHierarchyChartOptions,
    create: placeholderCreate,
};

export const StandaloneChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'standalone',
    placeholder: true,

    options: {},

    detect: isAgStandaloneChartOptions,
    create: placeholderCreate,
};

export const TopologyChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'topology',
    placeholder: true,

    options: {},

    detect: isAgTopologyChartOptions,
    create: placeholderCreate,
};
