import { type AgRadialBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    number,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { radialBarSeriesThemeableOptionsDef } = _ModuleSupport;

export const radialBarSeriesOptionsDef: OptionsDefs<AgRadialBarSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radialBarSeriesThemeableOptionsDef,
    type: required(constant('radial-bar')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// @ts-expect-error undocumented option
radialBarSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radialBarSeriesOptionsDef.radiusKeyAxis = undocumented(string);
