import type { AgPyramidSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    pyramidSeriesThemeableOptionsDef,
    required,
    string,
} from 'ag-charts-core';

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
