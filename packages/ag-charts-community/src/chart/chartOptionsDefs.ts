import {
    type OptionsDefs,
    array,
    arrayLength,
    arrayOfDefs,
    boolean,
    defined,
    geoJson,
    htmlElement,
    string,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgGaugeChartOptions,
    AgInitialStateLegendOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

import { commonChartOptionsDefs } from './commonOptionsDefs';

// These options are being validated by other modules
const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
    annotations: defined,
    navigator: defined,
    initialState: {
        chartType: string,
        annotations: defined,
        legend: arrayOfDefs<AgInitialStateLegendOptions>(
            {
                visible: boolean,
                seriesId: string,
                itemId: string,
                legendItemName: string,
            },
            'legend state array'
        ),
        zoom: defined,
    },
};

export const cartesianChartOptionsDefs: OptionsDefs<AgCartesianChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: arrayLength(2),
    data: array,
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: arrayLength(2),
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

export const gaugeChartOptionsDefs: OptionsDefs<AgGaugeChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
};
