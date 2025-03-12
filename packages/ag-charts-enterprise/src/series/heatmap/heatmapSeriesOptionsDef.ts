import { type AgHeatmapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    constant,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, autoSizedLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const heatmapSeriesOptionsDef: OptionsDefs<AgHeatmapSeriesOptions> = {
    type: required(constant('heatmap')),
    xKey: required(string),
    yKey: required(string),
    colorKey: string,
    xName: string,
    yName: string,
    colorName: string,
    colorRange: arrayOf(color),
    title: string,
    textAlign: union('left', 'center', 'right'),
    verticalAlign: union('top', 'middle', 'bottom'),
    itemPadding: positiveNumber,
    itemStyler: callback,
    showInMiniChart: boolean,
    label: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...strokeOptionsDef,
};
