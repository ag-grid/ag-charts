import { type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string, undocumented } from 'ag-charts-core';

const { radarAreaSeriesThemeableOptionsDef } = _ModuleSupport;

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarAreaSeriesThemeableOptionsDef,
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
};

// @ts-expect-error undocumented option
radarAreaSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radarAreaSeriesOptionsDef.radiusKeyAxis = undocumented(string);
