import { type AgHeatmapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, arrayOf, color, constant, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, heatmapSeriesThemeableOptionsDef } = _ModuleSupport;

export const heatmapSeriesOptionsDef: OptionsDefs<AgHeatmapSeriesOptions> = {
    ...heatmapSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('heatmap')),
    xKey: required(string),
    yKey: required(string),
    colorKey: string,
    xName: string,
    yName: string,
    colorName: string,
    colorRange: arrayOf(color),
};
