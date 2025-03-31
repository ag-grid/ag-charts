import { type OptionsDefs, array, attachDescription, defined, geoJson, union } from 'ag-charts-core';
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

// Pass validator if HTMLElement doesn't exist, for server-side environments.
const htmlElement = attachDescription(
    (value) => typeof HTMLElement === 'undefined' || value instanceof HTMLElement,
    'an html element'
);

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

export const cartesianChartOptionsDefs: OptionsDefs<AgCartesianChartOptions<never>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: defined,
    data: array,
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions<never>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: defined,
    data: array,
};

export const topologyChartOptionsDefs: OptionsDefs<AgTopologyChartOptions<never>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    topology: geoJson,
};

export const standaloneChartOptionsDefs: OptionsDefs<AgStandaloneChartOptions<never>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};

export const hierarchyChartOptionsDefs: OptionsDefs<AgHierarchyChartOptions<never>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};

export const flowProportionChartOptionsDefs: OptionsDefs<AgFlowProportionChartOptions<never>> = {
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
