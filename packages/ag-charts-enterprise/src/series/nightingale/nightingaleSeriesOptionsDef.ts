import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';
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
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const nightingaleSeriesOptionsDef: OptionsDefs<AgNightingaleSeriesOptions> = {
    type: required(constant('nightingale')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    cornerRadius: positiveNumber,
    itemStyler: callback,
    label: seriesLabelOptionsDef,
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
