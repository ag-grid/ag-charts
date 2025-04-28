import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, nightingaleSeriesThemeableOptionsDef } = _ModuleSupport;

export const nightingaleSeriesOptionsDef: OptionsDefs<AgNightingaleSeriesOptions> = {
    ...nightingaleSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('nightingale')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};
