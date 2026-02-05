import {
    type OptionsDefs,
    array,
    arrayOfDefs,
    boolean,
    commonChartOptionsDefs,
    defined,
    geoJson,
    htmlElement,
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
};
// @ts-expect-error undocumented option
initialStatePickedOptionsDef.frozen = undocumented(boolean);

// These options are being validated by other modules
export const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
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
    axes: object,
    data: array,
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
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
