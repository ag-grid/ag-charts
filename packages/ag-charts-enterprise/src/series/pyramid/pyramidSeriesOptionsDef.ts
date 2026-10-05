import type { AgPyramidSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    pyramidSeriesThemeableOptionsDef,
    required,
    string,
    without,
} from 'ag-charts-core';

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
