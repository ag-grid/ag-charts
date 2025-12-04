import { type AgRadarLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string } from 'ag-charts-core';

const { radarLineSeriesThemeableOptionsDef } = _ModuleSupport;

export const radarLineSeriesOptionsDef: OptionsDefs<AgRadarLineSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarLineSeriesThemeableOptionsDef,
    type: required(constant('radar-line')),
    angleKey: required(string),
    radiusKey: required(string),
    angleKeyAxis: string,
    radiusKeyAxis: string,
    angleName: string,
    radiusName: string,
    legendItemName: string,
};
