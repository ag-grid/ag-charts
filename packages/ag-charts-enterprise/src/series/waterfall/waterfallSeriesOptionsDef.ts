import {
    type AgWaterfallSeriesItemOptions,
    type AgWaterfallSeriesOptions,
    type WaterfallSeriesTotalMeta,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    callback,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

const waterfallSeriesItemOptionsDef: OptionsDefs<AgWaterfallSeriesItemOptions<never>> = {
    name: string,
    cornerRadius: positiveNumber,
    itemStyler: callback,
    label: {
        ...seriesLabelOptionsDefs,
        padding: positiveNumber,
        placement: union('inside-start', 'inside-center', 'inside-end', 'outside-start', 'outside-end'),
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const waterfallSeriesOptionsDef: OptionsDefs<AgWaterfallSeriesOptions<never>> = {
    type: required(constant('waterfall')),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    direction: union('horizontal', 'vertical'),
    totals: arrayOfDefs<WaterfallSeriesTotalMeta>(
        {
            totalType: required(union('total', 'subtotal')),
            index: required(positiveNumber),
            axisLabel: required(string),
        },
        'a total definition options array'
    ),
    showInMiniChart: boolean,
    item: {
        positive: waterfallSeriesItemOptionsDef,
        negative: waterfallSeriesItemOptionsDef,
        total: waterfallSeriesItemOptionsDef,
    },
    line: {
        enabled: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};
