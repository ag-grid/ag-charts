import { type OptionsDefs, array, defined, geoJson, htmlElement, union } from 'ag-charts-core';
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

// These options are being validated by other modules
const commonChartOptions = {
    mode: union('integrated', 'standalone'),
    container: htmlElement,
    theme: defined,
    series: array,
    annotations: defined,
    navigator: defined,
    initialState: defined,
};

export const cartesianChartOptionsDefs: OptionsDefs<AgCartesianChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: defined,
    data: array,
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: defined,
    data: array,
};

export const topologyChartOptionsDefs: OptionsDefs<AgTopologyChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    topology: geoJson,
};

export const standaloneChartOptionsDefs: OptionsDefs<AgStandaloneChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};

export const hierarchyChartOptionsDefs: OptionsDefs<AgHierarchyChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};

export const flowProportionChartOptionsDefs: OptionsDefs<AgFlowProportionChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    nodes: array,
};

export const gaugeChartOptionsDefs: OptionsDefs<AgGaugeChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};
