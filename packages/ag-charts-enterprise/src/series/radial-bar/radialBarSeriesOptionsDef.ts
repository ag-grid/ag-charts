import { type AgRadialBarSeriesOptions, type AgRadialSeriesStyle, _ModuleSupport } from 'ag-charts-community';
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
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const radialBarSeriesOptionsDef: OptionsDefs<AgRadialBarSeriesOptions> = {
    type: required(constant('radial-bar')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgRadialSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
