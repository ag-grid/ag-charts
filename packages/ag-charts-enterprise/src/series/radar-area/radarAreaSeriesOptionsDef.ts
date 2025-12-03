import { type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string } from 'ag-charts-core';

const { radarAreaSeriesThemeableOptionsDef } = _ModuleSupport;

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarAreaSeriesThemeableOptionsDef,
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleKeyAxis: string,
    radiusKeyAxis: string,
    angleName: string,
    radiusName: string,
    legendItemName: string,
};
