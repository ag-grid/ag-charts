import { type AgHeatmapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    color,
    commonSeriesOptionsDefs,
    constant,
    required,
    string,
    without,
} from 'ag-charts-core';

const { heatmapSeriesThemeableOptionsDef } = _ModuleSupport;

export const heatmapSeriesOptionsDef: OptionsDefs<AgHeatmapSeriesOptions> = {
    ...without(heatmapSeriesThemeableOptionsDef, ['showInLegend']),
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    type: required(constant('heatmap')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    colorKey: string,
    xName: string,
    yName: string,
    colorName: string,
    colorRange: arrayOf(color),
};
