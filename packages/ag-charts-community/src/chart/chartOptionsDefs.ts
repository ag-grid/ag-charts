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
    positiveNumber,
    string,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgInitialStateLegendOptions,
    AgPickedState,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

const pickedSeriesStateOptionsDef: OptionsDefs<NonNullable<AgPickedState['series']>> = {
    seriesId: string,
};

const pickedItemsStateOptionsDef: OptionsDefs<NonNullable<AgPickedState['items']>> = {
    seriesId: string,
    itemId: string,
};

export const initialStatePickedOptionsDef: OptionsDefs<AgPickedState> = {
    activeIndex: positiveNumber,
    series: arrayOfDefs(pickedSeriesStateOptionsDef),
    items: arrayOfDefs(pickedItemsStateOptionsDef),
    frozen: boolean,
};

// These options are being validated by other modules
export const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
    annotations: defined,
    navigator: defined,
    initialState: {
        picked: initialStatePickedOptionsDef,
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
