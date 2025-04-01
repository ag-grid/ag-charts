import { type AgRangeAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
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

const {
    commonSeriesOptionsDefs,
    interpolationValidator,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} = _ModuleSupport;

export const rangeAreaSeriesOptionsDef: OptionsDefs<AgRangeAreaSeriesOptions<never>> = {
    type: required(constant('range-area')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationValidator,
    label: {
        ...seriesLabelOptionsDefs,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.pickOutsideVisibleMinorAxis = boolean;
// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.focusPriority = number;
