import { type OptionsDefs, array, object } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgFlowProportionChartOptions,
    AgGaugeChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

import { commonChartOptionsDefs } from './commonOptionsDefs';

export type OmitChartAddons<T> = Omit<
    T,
    'container' | 'theme' | 'axes' | 'series' | 'annotations' | 'navigator' | 'initialState'
>;

export const cartesianChartOptionsDefs: OptionsDefs<OmitChartAddons<AgCartesianChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
};

export const polarChartOptionsDefs: OptionsDefs<OmitChartAddons<AgPolarChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
};

export const topologyChartOptionsDefs: OptionsDefs<OmitChartAddons<AgTopologyChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
    topology: object,
};

export const standaloneChartOptionsDefs: OptionsDefs<OmitChartAddons<AgStandaloneChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
};

export const hierarchyChartOptionsDefs: OptionsDefs<OmitChartAddons<AgHierarchyChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
};

export const flowProportionChartOptionsDefs: OptionsDefs<OmitChartAddons<AgFlowProportionChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
    nodes: array,
};

export const gaugeChartOptionsDefs: OptionsDefs<OmitChartAddons<AgGaugeChartOptions>> = {
    ...commonChartOptionsDefs,
    data: array,
};
