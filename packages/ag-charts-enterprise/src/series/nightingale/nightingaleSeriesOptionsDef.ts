import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, nightingaleSeriesThemeableOptionsDef } = _ModuleSupport;

export const nightingaleSeriesOptionsDef: OptionsDefs<AgNightingaleSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...nightingaleSeriesThemeableOptionsDef,
    type: required(constant('nightingale')),
    angleKey: required(string),
    radiusKey: required(string),
    angleKeyAxis: string,
    radiusKeyAxis: string,
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};
