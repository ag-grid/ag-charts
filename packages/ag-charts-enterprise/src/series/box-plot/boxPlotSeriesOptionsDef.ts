import { type AgBoxPlotSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, required, shapeSegmentation, string } from 'ag-charts-core';

const { boxPlotSeriesThemeableOptionsDef, commonSeriesOptionsDefs } = _ModuleSupport;

export const boxPlotSeriesOptionsDef: OptionsDefs<AgBoxPlotSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...boxPlotSeriesThemeableOptionsDef,
    type: required(constant('box-plot')),
    xKey: required(string),
    minKey: required(string),
    q1Key: required(string),
    medianKey: required(string),
    q3Key: required(string),
    maxKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    minName: string,
    q1Name: string,
    medianName: string,
    q3Name: string,
    maxName: string,
    grouped: boolean,
    legendItemName: string,
    segmentation: shapeSegmentation,
};
