import { type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, radarAreaSeriesThemeableOptionsDef } = _ModuleSupport;

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions> = {
    ...radarAreaSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
};
