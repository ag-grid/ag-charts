import { type AgWaterfallSeriesOptions, type WaterfallSeriesTotalMeta, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    commonSeriesOptionsDefs,
    constant,
    positiveNumber,
    positiveNumberNonZero,
    required,
    string,
    union,
} from 'ag-charts-core';

const { waterfallSeriesThemeableOptionsDef } = _ModuleSupport;

export const waterfallSeriesOptionsDef: OptionsDefs<AgWaterfallSeriesOptions> = {
    ...waterfallSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('waterfall')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    totals: arrayOfDefs<WaterfallSeriesTotalMeta>(
        {
            totalType: required(union('total', 'subtotal')),
            index: required(positiveNumber),
            axisLabel: required(string),
        },
        'a total definition options array'
    ),
    width: positiveNumberNonZero,
};
