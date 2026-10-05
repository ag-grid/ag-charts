import type { AgRadarAreaSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    radarAreaSeriesThemeableOptionsDef,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

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
