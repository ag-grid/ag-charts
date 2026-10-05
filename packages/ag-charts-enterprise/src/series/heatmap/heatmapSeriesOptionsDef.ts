import type { AgHeatmapSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    constant,
    heatmapSeriesThemeableOptionsDef,
    required,
    string,
    without,
} from 'ag-charts-core';

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
    colorScale: colorScaleOptionsDef,
};
