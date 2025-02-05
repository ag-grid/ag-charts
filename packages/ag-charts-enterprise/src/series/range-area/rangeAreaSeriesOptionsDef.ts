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
    commonSeriesOptionsDef,
    interpolationValidator,
    markerOptionsDef,
    seriesLabelOptionsDef,
    shadowOptionsDef,
    tooltipOptionsDef,
} = _ModuleSupport;

export const rangeAreaSeriesOptionsDef: OptionsDefs<AgRangeAreaSeriesOptions> = {
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
        ...seriesLabelOptionsDef,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    marker: markerOptionsDef,
    tooltip: tooltipOptionsDef,
    shadow: shadowOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,

    // @ts-expect-error undocumented option
    pickOutsideVisibleMinorAxis: boolean,
    focusPriority: number,
};
