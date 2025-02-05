import { type AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callback,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, shadowOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const rangeBarSeriesOptionsDef: OptionsDefs<AgRangeBarSeriesOptions> = {
    type: required(constant('range-bar')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    itemStyler: callback,
    label: {
        ...seriesLabelOptionsDef,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    tooltip: tooltipOptionsDef,
    shadow: shadowOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,

    // @ts-expect-error undocumented option
    pickOutsideVisibleMinorAxis: boolean,
    fastDataProcessing: boolean,
    focusPriority: number,
};
