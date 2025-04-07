import { type AgRangeBarSeriesOptions, type AgRangeBarSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    undocumented,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

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
    itemStyler: callbackDefs<AgRangeBarSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
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
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.fastDataProcessing = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = undocumented(number);
