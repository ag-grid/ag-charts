import { type AgRadialColumnSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, radialColumnSeriesThemeableOptionsDef } = _ModuleSupport;

export const radialColumnSeriesOptionsDef: OptionsDefs<AgRadialColumnSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radialColumnSeriesThemeableOptionsDef,
    type: required(constant('radial-column')),
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
