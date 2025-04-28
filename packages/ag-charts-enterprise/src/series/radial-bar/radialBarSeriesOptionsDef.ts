import { type AgRadialBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, radialBarSeriesThemeableOptionsDef } = _ModuleSupport;

export const radialBarSeriesOptionsDef: OptionsDefs<AgRadialBarSeriesOptions> = {
    ...radialBarSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('radial-bar')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};
