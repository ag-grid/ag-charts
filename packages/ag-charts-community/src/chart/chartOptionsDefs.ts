import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    commonChartOptionsDefs,
    defined,
    geoJson,
    htmlElement,
    nonNegativeInteger,
    number,
    object,
    or,
    positiveNumber,
    required,
    strictUnion,
    string,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgActiveState,
    AgCartesianChartOptions,
    AgInitialStateLegendOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

export const initialStatePickedOptionsDef: OptionsDefs<AgActiveState> = {
    activeItem: {
        type: required(strictUnion<AgActiveItemState['type']>()('series-node', 'legend')),
        seriesId: string,
        itemId: required(or(string, positiveNumber)),
    },
    frozen: boolean,
};

// These options are being validated by other modules
export const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
    withinStudio: undocumented(boolean),
    loading: boolean,
    validations: undocumented({
        overlayLevel: union('error', 'warning', 'deprecation', 'none'),
    }),
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
    annotations: defined,
    navigator: defined,
    scrollbar: defined,
    initialState: {
        active: initialStatePickedOptionsDef,
        chartType: string,
        collapsed: arrayOf(or(string, number)),
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
        legendPagination: nonNegativeInteger,
        zoom: defined,
    },
};

export const cartesianChartOptionsDefs: OptionsDefs<AgCartesianChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
    data: array,
    dataIdKey: string,
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
    data: array,
    dataIdKey: string,
};

export const topologyChartOptionsDefs: OptionsDefs<AgTopologyChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
    topology: geoJson,
};

export const standaloneChartOptionsDefs: OptionsDefs<AgStandaloneChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
};
