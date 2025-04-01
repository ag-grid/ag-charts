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

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const rangeBarSeriesOptionsDef: OptionsDefs<AgRangeBarSeriesOptions<never>> = {
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
        ...seriesLabelOptionsDefs,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = boolean;
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.fastDataProcessing = boolean;
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = number;
