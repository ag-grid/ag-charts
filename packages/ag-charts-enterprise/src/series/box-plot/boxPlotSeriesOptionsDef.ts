import { type AgBoxPlotSeriesOptions, type AgBoxPlotSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const boxPlotSeriesOptionsDef: OptionsDefs<AgBoxPlotSeriesOptions> = {
    type: required(constant('box-plot')),
    xKey: required(string),
    minKey: required(string),
    q1Key: required(string),
    medianKey: required(string),
    q3Key: required(string),
    maxKey: required(string),
    xName: string,
    yName: string,
    minName: string,
    q1Name: string,
    medianName: string,
    q3Name: string,
    maxName: string,
    direction: union('horizontal', 'vertical'),
    grouped: boolean,
    legendItemName: string,
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgBoxPlotSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
        whisker: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
        cap: {
            lengthRatio: ratio,
        },
    }),
    whisker: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    cap: {
        lengthRatio: ratio,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
